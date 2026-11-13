const { default: OpenAI, APIConnectionTimeoutError } = require("openai");
const { env } = require("../config/env");
const { buildSystemPrompt } = require("./agent.prompt");
const { TOOLS, ejecutarTool } = require("./agent.tools");

const MAX_TOOL_ROUNDS = 4;
const NOMBRE_WEB = "TrailVerse";

const MENSAJES_ERROR = {
  saturado: "El asistente está recibiendo muchas consultas ahora mismo. Inténtalo de nuevo en unos segundos.",
  timeout: "La respuesta ha tardado demasiado. Inténtalo de nuevo.",
  generico: "No he podido responder en este momento. Inténtalo más tarde."
};

let clienteLlm = null;

function obtenerClienteLlm() {
  if (!clienteLlm) {
    clienteLlm = new OpenAI({
      baseURL: env.LLM_PROVIDER_BASE_URL,
      apiKey: env.LLM_API_KEY,
      timeout: env.AGENT_TIMEOUT_MS,
      maxRetries: 1
    });
  }
  return clienteLlm;
}

function esReintentable(error) {
  return error instanceof APIConnectionTimeoutError || error.status === 429 || error.status >= 500;
}

function clasificarError(error) {
  if (error instanceof APIConnectionTimeoutError) return MENSAJES_ERROR.timeout;
  if (error.status === 429) return MENSAJES_ERROR.saturado;
  return MENSAJES_ERROR.generico;
}

// Intenta el modelo principal y, si está saturado o falla antes de empezar a emitir, el de respaldo.
async function abrirStream(llm, parametros, signal) {
  const modelos = [env.LLM_MODEL, env.LLM_FALLBACK_MODEL].filter(
    (modelo, indice, lista) => modelo && lista.indexOf(modelo) === indice
  );

  let ultimoError;
  for (const model of modelos) {
    try {
      return await llm.chat.completions.create({ ...parametros, model, stream: true }, { signal });
    } catch (error) {
      ultimoError = error;
      if (signal?.aborted || !esReintentable(error)) throw error;
    }
  }

  throw ultimoError;
}

async function leerRonda(stream, emit) {
  let texto = "";
  const llamadas = new Map();

  for await (const fragmento of stream) {
    const eleccion = fragmento.choices?.[0];
    if (!eleccion) continue;

    const delta = eleccion.delta ?? {};

    if (delta.content) {
      texto += delta.content;
      emit("token", { texto: delta.content });
    }

    for (const parcial of delta.tool_calls ?? []) {
      const actual = llamadas.get(parcial.index) ?? { id: "", name: "", arguments: "" };
      if (parcial.id) actual.id = parcial.id;
      if (parcial.function?.name && !actual.name) actual.name = parcial.function.name;
      if (parcial.function?.arguments) actual.arguments += parcial.function.arguments;
      llamadas.set(parcial.index, actual);
    }
  }

  return { texto, llamadas: [...llamadas.values()] };
}

// Bucle de tool calling: el modelo pide tools, el backend las ejecuta y el modelo responde.
// Máximo MAX_TOOL_ROUNDS rondas con tools; después una ronda final sin tools.
async function responderChat({ message, history = [], routeId, emit, signal, llm = obtenerClienteLlm() }) {
  const inicio = Date.now();
  const contexto = { routeId };
  const herramientasUsadas = [];
  const mensajes = [
    { role: "system", content: buildSystemPrompt({ nombreWeb: NOMBRE_WEB, routeId }) },
    ...history.map(({ role, content }) => ({ role, content })),
    { role: "user", content: message }
  ];

  try {
    for (let ronda = 0; ronda <= MAX_TOOL_ROUNDS; ronda++) {
      const conTools = ronda < MAX_TOOL_ROUNDS;
      const parametros = {
        messages: mensajes,
        temperature: 0.2,
        ...(conTools && { tools: TOOLS, tool_choice: "auto" })
      };

      const stream = await abrirStream(llm, parametros, signal);
      const { texto, llamadas } = await leerRonda(stream, emit);

      if (!conTools || llamadas.length === 0) {
        emit("done", {});
        registrar({ inicio, rondas: ronda + 1, herramientasUsadas, routeId, message, estado: "ok" });
        return;
      }

      mensajes.push({
        role: "assistant",
        content: texto || null,
        tool_calls: llamadas.map((llamada, indice) => ({
          id: llamada.id || `call_${ronda}_${indice}`,
          type: "function",
          function: { name: llamada.name, arguments: llamada.arguments || "{}" }
        }))
      });

      for (const [indice, llamada] of llamadas.entries()) {
        const id = llamada.id || `call_${ronda}_${indice}`;
        emit("tool", { nombre: llamada.name, estado: "ejecutando" });
        const resultado = await ejecutarTool(llamada.name, llamada.arguments, contexto);
        herramientasUsadas.push(llamada.name);
        mensajes.push({ role: "tool", tool_call_id: id, content: JSON.stringify(resultado) });
        emit("tool", { nombre: llamada.name, estado: "hecho" });
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      registrar({ inicio, rondas: 0, herramientasUsadas, routeId, message, estado: "cancelado" });
      return;
    }

    console.error("[agent] error del proveedor:", error.status ?? "", error.message);
    emit("error", { mensaje: clasificarError(error) });
    registrar({ inicio, rondas: 0, herramientasUsadas, routeId, message, estado: "error" });
  }
}

// Log sin contenido: solo metadatos de la consulta.
function registrar({ inicio, rondas, herramientasUsadas, routeId, message, estado }) {
  console.info("[agent]", JSON.stringify({
    estado,
    ms: Date.now() - inicio,
    rondas,
    herramientas: herramientasUsadas,
    conRuta: Boolean(routeId),
    longitudMensaje: message.length
  }));
}

module.exports = { responderChat, MAX_TOOL_ROUNDS };
