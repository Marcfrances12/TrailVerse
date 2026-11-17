const geo = require("./geo.client");
const { puntoDeInicio } = require("./route-data");

const CATEGORIAS_GUIA = [
  { categoria: "restaurant", etiqueta: "Dónde comer", radioM: 2000 },
  { categoria: "lodging", etiqueta: "Dónde dormir", radioM: 5000 },
  { categoria: "transport", etiqueta: "Transporte público", radioM: 2000 },
  { categoria: "parking", etiqueta: "Aparcamiento", radioM: 2000 }
];

const TIMEOUT_OVERPASS_MS = 120000;

function instruccionesResumen() {
  return [
    "Eres el redactor de guías de TrailVerse. Con la lista de lugares que recibes, escribe un resumen breve en español:",
    "una línea por categoría que tenga resultados, con los nombres de los sitios más cercanos y su distancia.",
    "Usa solo los nombres y distancias de la lista. No añadas horarios, precios, valoraciones ni sitios que no aparezcan.",
    "Si una categoría está vacía, indícalo en una frase. Sin introducciones ni despedidas."
  ].join("\n");
}

async function resumirLugares(lugares, { llm, model }) {
  if (lugares.every((grupo) => grupo.resultados.length === 0)) return null;

  const respuesta = await llm.chat.completions.create({
    model,
    messages: [
      { role: "system", content: instruccionesResumen() },
      {
        role: "user",
        content: JSON.stringify(
          lugares.map(({ etiqueta, resultados }) => ({
            categoria: etiqueta,
            lugares: resultados.map(({ nombre, tipo, distanciaM }) => ({ nombre, tipo, distanciaM }))
          })),
          null,
          2
        )
      }
    ],
    temperature: 0.2,
    reasoning_effort: "low"
  });

  return respuesta.choices?.[0]?.message?.content?.trim() || null;
}

// Consulta OSM una vez por ruta y pide al modelo un resumen con esos mismos lugares.
async function generarGuiaLugares(ruta, { llm, model }) {
  const inicio = puntoDeInicio(ruta);
  if (!inicio) throw new Error("La ruta no tiene punto de inicio");

  const porCategoria = await geo.buscarLugaresPorCategorias({
    lat: inicio.lat,
    lng: inicio.lng,
    categorias: CATEGORIAS_GUIA,
    timeoutMs: TIMEOUT_OVERPASS_MS
  });

  const lugares = CATEGORIAS_GUIA.map(({ categoria, etiqueta, radioM }) => ({
    categoria,
    etiqueta,
    radioM,
    resultados: porCategoria[categoria] ?? []
  }));

  const resumen = await resumirLugares(lugares, { llm, model });

  return { generadaEn: new Date(), inicio, lugares, resumen };
}

module.exports = { generarGuiaLugares, CATEGORIAS_GUIA, instruccionesResumen };
