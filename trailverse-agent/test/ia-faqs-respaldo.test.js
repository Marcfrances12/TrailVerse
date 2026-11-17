const { test } = require("node:test");
const assert = require("node:assert/strict");

const { generarFaqs, faqGeneradaSchema, construirMensajes } = require("../src/agent/faq-generator");
const { responderChat, candidatosDeModelo } = require("../src/agent/agent.service");

const RUTA = {
  nombre: "Ruta de prueba",
  descripcion: "Sendero corto por el bosque.",
  dificultad: "facil",
  distanciaKm: 3.2,
  desnivelM: 90,
  duracionHoras: 1.5,
  circular: true,
  locationId: { nombre: "Ontinyent", provincia: "Valencia", comunidad: "Comunidad Valenciana" }
};

const FAQS_VALIDAS = [
  { pregunta: "¿Es apta para niños?", respuesta: "Sí, es un paseo sencillo de 3,2 km.", tags: ["familias"] },
  { pregunta: "¿Qué llevar en la ruta?", respuesta: "Calzado cómodo y agua suficiente.", tags: ["material"] },
  { pregunta: "¿Cuánto dura?", respuesta: "Unas 1,5 horas a paso tranquilo.", tags: [] }
];

function llmConRespuestas(respuestas) {
  const llamadas = [];
  return {
    llamadas,
    chat: {
      completions: {
        create: async (parametros) => {
          llamadas.push(parametros);
          const contenido = respuestas[llamadas.length - 1] ?? respuestas.at(-1);
          return { choices: [{ message: { content: contenido } }] };
        }
      }
    }
  };
}

function streamDe(fragmentos) {
  return (async function* () {
    for (const fragmento of fragmentos) yield fragmento;
  })();
}

test("faqGeneradaSchema acepta entre 3 y 6 FAQs con pregunta y respuesta", () => {
  assert.equal(faqGeneradaSchema.safeParse({ faqs: FAQS_VALIDAS }).success, true);
  assert.equal(faqGeneradaSchema.safeParse({ faqs: FAQS_VALIDAS.slice(0, 2) }).success, false);
  assert.equal(faqGeneradaSchema.safeParse({ faqs: [{ pregunta: "hola", respuesta: "corta" }] }).success, false);
});

test("generarFaqs devuelve las FAQs validadas del modelo", async () => {
  const llm = llmConRespuestas([JSON.stringify({ faqs: FAQS_VALIDAS })]);

  const faqs = await generarFaqs(RUTA, { llm, model: "modelo-test" });

  assert.equal(faqs.length, 3);
  assert.equal(llm.llamadas[0].model, "modelo-test");
  assert.deepEqual(llm.llamadas[0].response_format, { type: "json_object" });
});

test("generarFaqs reintenta con una corrección si la primera respuesta no es JSON válido", async () => {
  const llm = llmConRespuestas(["esto no es json", JSON.stringify({ faqs: FAQS_VALIDAS })]);

  const faqs = await generarFaqs(RUTA, { llm, model: "modelo-test" });

  assert.equal(faqs.length, 3);
  assert.equal(llm.llamadas.length, 2);
  assert.match(llm.llamadas[1].messages.at(-1).content, /no era válida/);
});

test("generarFaqs falla si el modelo no devuelve FAQs válidas tras reintentar", async () => {
  const llm = llmConRespuestas([JSON.stringify({ faqs: [] })]);

  await assert.rejects(generarFaqs(RUTA, { llm, model: "modelo-test" }), /no devolvió FAQs válidas/);
});

test("construirMensajes incluye los datos de la ruta y la ubicación", () => {
  const mensajes = construirMensajes(RUTA);
  assert.match(mensajes[1].content, /Ruta de prueba/);
  assert.match(mensajes[1].content, /Ontinyent/);
});

test("candidatosDeModelo añade el proveedor de respaldo al final", () => {
  const llm = { nombre: "principal" };
  const respaldo = { llm: { nombre: "respaldo" }, model: "modelo-respaldo" };

  const candidatos = candidatosDeModelo(llm, respaldo);

  assert.equal(candidatos.at(-1).model, "modelo-respaldo");
  assert.equal(candidatos.at(-1).llm.nombre, "respaldo");
  assert.equal(candidatosDeModelo(llm, null).some((c) => c.llm.nombre === "respaldo"), false);
});

test("responderChat usa el proveedor de respaldo si el principal responde 503 antes de emitir", async () => {
  const principal = {
    chat: {
      completions: {
        create: async () => {
          const error = new Error("servicio no disponible");
          error.status = 503;
          throw error;
        }
      }
    }
  };
  const llmRespaldo = llmConRespuestas([]);
  llmRespaldo.chat.completions.create = async (parametros) => {
    llmRespaldo.llamadas.push(parametros);
    return streamDe([{ choices: [{ delta: { content: "Desde el respaldo" } }] }]);
  };

  const eventos = [];
  await responderChat({
    message: "hola",
    history: [],
    emit: (evento, datos) => eventos.push({ evento, datos }),
    llm: principal,
    respaldo: { llm: llmRespaldo, model: "modelo-respaldo" }
  });

  assert.equal(llmRespaldo.llamadas[0].model, "modelo-respaldo");
  assert.equal(eventos.find((e) => e.evento === "token").datos.texto, "Desde el respaldo");
  assert.equal(eventos.at(-1).evento, "done");
});
