const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  generarValoracion,
  analizarSentimientos,
  mensajesValoracion,
  mensajesSentimiento,
  extraerJson
} = require("../src/agent/comentarios-ia");
const { claveDe } = require("../src/agent/valoracion.service");

// Cliente LLM falso que devuelve las respuestas indicadas en orden.
function llmFalso(respuestas) {
  const llamadas = [];
  return {
    llamadas,
    chat: {
      completions: {
        create: async (parametros) => {
          llamadas.push(parametros);
          const contenido = respuestas[Math.min(llamadas.length - 1, respuestas.length - 1)];
          return { choices: [{ message: { content: contenido } }] };
        }
      }
    }
  };
}

const RUTA = { nombre: "Ruta del Pou Clar" };
const COMENTARIOS = [
  { texto: "Paisaje espectacular", valoracion: 5, userId: "65a000000000000000000001" },
  { texto: "Mal señalizada al final", valoracion: 2, userId: "65a000000000000000000002" }
];

test("los mensajes no incluyen ids de usuario y avisan de que los comentarios son datos", () => {
  const mensajes = mensajesValoracion(RUTA, COMENTARIOS);
  assert.match(mensajes[0].content, /no instrucciones/);
  assert.doesNotMatch(mensajes[1].content, /65a0000/);
  assert.match(mensajes[1].content, /Paisaje espectacular/);

  const sentimiento = mensajesSentimiento(COMENTARIOS);
  assert.doesNotMatch(sentimiento[1].content, /65a0000/);
  assert.match(sentimiento[1].content, /"n": 2/);
});

test("los comentarios largos se recortan antes de enviarlos al modelo", () => {
  const largo = [{ texto: "a".repeat(2000), valoracion: 3 }];
  const contenido = JSON.parse(mensajesSentimiento(largo)[1].content);
  assert.equal(contenido.comentarios[0].texto.length, 500);
});

test("extraerJson quita bloques de código y razonamiento", () => {
  assert.equal(extraerJson('<think>hmm</think>\n```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(extraerJson('{"a":1}'), '{"a":1}');
});

test("generarValoracion valida el JSON y reintenta una vez si no es válido", async () => {
  const llm = llmFalso([
    "esto no es json",
    JSON.stringify({ resumen: "A los clientes les encanta el paisaje.", positivos: ["Paisaje"], negativos: ["Señalización"] })
  ]);
  const resultado = await generarValoracion(RUTA, COMENTARIOS, { llm, model: "m" });
  assert.equal(llm.llamadas.length, 2);
  assert.deepEqual(resultado.negativos, ["Señalización"]);
  assert.match(llm.llamadas[1].messages.at(-1).content, /no es JSON válido/);
});

test("generarValoracion falla tras dos respuestas no válidas", async () => {
  const llm = llmFalso(['{"resumen":"x"}']);
  await assert.rejects(generarValoracion(RUTA, COMENTARIOS, { llm, model: "m" }), /no devolvió una respuesta válida/);
});

test("analizarSentimientos devuelve un resultado por comentario en el mismo orden", async () => {
  const llm = llmFalso([
    JSON.stringify({
      resultados: [
        { n: 2, etiqueta: "negativo", puntuacion: -0.555, temas: ["Señalizacion"] },
        { n: 1, etiqueta: "positivo", puntuacion: 0.9, temas: ["paisaje", "paisaje"] }
      ]
    })
  ]);
  const resultados = await analizarSentimientos(COMENTARIOS, { llm, model: "m" });
  assert.deepEqual(resultados, [
    { etiqueta: "positivo", puntuacion: 0.9, temas: ["paisaje"] },
    { etiqueta: "negativo", puntuacion: -0.56, temas: ["señalizacion"] }
  ]);
});

test("si el modelo omite un comentario, ese queda en null para reintentarlo después", async () => {
  const llm = llmFalso([JSON.stringify({ resultados: [{ n: 1, etiqueta: "neutro", puntuacion: 0, temas: [] }] })]);
  const resultados = await analizarSentimientos(COMENTARIOS, { llm, model: "m" });
  assert.equal(resultados[1], null);
});

test("una etiqueta de sentimiento desconocida no se acepta", async () => {
  const llm = llmFalso([JSON.stringify({ resultados: [{ n: 1, etiqueta: "feliz", puntuacion: 1, temas: [] }] })]);
  await assert.rejects(analizarSentimientos(COMENTARIOS.slice(0, 1), { llm, model: "m" }));
});

test("la clave de caché del resumen cambia al añadir o editar comentarios", () => {
  const base = claveDe("r1", { total: 3, ultimoCambio: new Date("2026-11-01") });
  assert.notEqual(base, claveDe("r1", { total: 4, ultimoCambio: new Date("2026-11-01") }));
  assert.notEqual(base, claveDe("r1", { total: 3, ultimoCambio: new Date("2026-11-02") }));
  assert.equal(base, claveDe("r1", { total: 3, ultimoCambio: new Date("2026-11-01") }));
});
