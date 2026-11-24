// Analiza con IA el sentimiento de los comentarios de clientes y lo guarda en `comments.sentimiento`.
// El dashboard del admin agrega estos resultados por ruta (backend: GET /api/admin/comments/sentimiento).
// Uso: npm run sentimiento:analizar -- [--todos] [--limite=200] [--dry-run]
//   --todos     vuelve a analizar también los que ya tienen sentimiento
//   --limite=N  máximo de comentarios a procesar en esta ejecución (por defecto 500)
//   --dry-run   muestra el resultado en consola sin guardarlo

const mongoose = require("mongoose");
const { default: OpenAI } = require("openai");
const { env } = require("../src/config/env");
const { analizarSentimientos } = require("../src/agent/comentarios-ia");

const TAMANO_LOTE = 10;
const PAUSA_ENTRE_LOTES_MS = 4000;
const TIMEOUT_GENERACION_MS = 120000;
const LIMITE_POR_DEFECTO = 500;

function leerArgumentos(argv) {
  const opciones = { todos: false, limite: LIMITE_POR_DEFECTO, dryRun: false };

  for (const argumento of argv) {
    if (argumento === "--todos") opciones.todos = true;
    else if (argumento === "--dry-run") opciones.dryRun = true;
    else if (argumento.startsWith("--limite=")) {
      const limite = Number(argumento.slice("--limite=".length));
      if (!Number.isInteger(limite) || limite < 1) throw new Error("--limite debe ser un entero positivo");
      opciones.limite = limite;
    } else throw new Error(`Argumento desconocido: ${argumento}`);
  }

  return opciones;
}

function filtroPara(opciones) {
  const filtro = { deleted_at: null };
  if (!opciones.todos) filtro.$or = [{ sentimiento: { $exists: false } }, { sentimiento: null }];
  return filtro;
}

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function enLotes(lista, tamano) {
  const lotes = [];
  for (let i = 0; i < lista.length; i += tamano) lotes.push(lista.slice(i, i + tamano));
  return lotes;
}

async function main() {
  const opciones = leerArgumentos(process.argv.slice(2));

  if (!env.FAQ_LLM_API_KEY) throw new Error("Falta FAQ_LLM_API_KEY en el .env del agente");

  const uri = env.MONGODB_URI_ESCRITURA || env.MONGODB_URI;
  if (!uri) throw new Error("Falta MONGODB_URI_ESCRITURA (o MONGODB_URI) en el .env del agente");
  if (!env.MONGODB_URI_ESCRITURA) {
    console.warn("MONGODB_URI_ESCRITURA no está definida: se usa MONGODB_URI, que debe tener permiso de escritura.");
  }

  const conexion = await mongoose.createConnection(uri).asPromise();
  const llm = new OpenAI({
    baseURL: env.FAQ_LLM_BASE_URL,
    apiKey: env.FAQ_LLM_API_KEY,
    timeout: TIMEOUT_GENERACION_MS,
    maxRetries: 5
  });

  try {
    const coleccion = conexion.collection("comments");
    const comentarios = await coleccion
      .find(filtroPara(opciones), { projection: { texto: 1, valoracion: 1 } })
      .sort({ created_at: 1 })
      .limit(opciones.limite)
      .toArray();

    console.log(`${comentarios.length} comentarios a analizar (modelo ${env.FAQ_LLM_MODEL})`);

    let guardados = 0;
    let omitidos = 0;
    let lotesFallidos = 0;

    for (const [indice, lote] of enLotes(comentarios, TAMANO_LOTE).entries()) {
      if (indice > 0) await esperar(PAUSA_ENTRE_LOTES_MS);

      try {
        const resultados = await analizarSentimientos(lote, { llm, model: env.FAQ_LLM_MODEL });
        const analizadoEn = new Date();

        for (const [posicion, comentario] of lote.entries()) {
          const resultado = resultados[posicion];
          if (!resultado) {
            omitidos++;
            continue;
          }

          if (opciones.dryRun) {
            console.log(`${comentario._id} [${comentario.valoracion}★] ${resultado.etiqueta} ${resultado.puntuacion} ${resultado.temas.join(", ")}`);
            guardados++;
            continue;
          }

          // Solo se guarda si el texto no ha cambiado mientras se analizaba.
          // El driver no toca updated_at, así que el comentario no aparece como "editado".
          const { modifiedCount } = await coleccion.updateOne(
            { _id: comentario._id, texto: comentario.texto, deleted_at: null },
            { $set: { sentimiento: { ...resultado, analizadoEn } } }
          );
          if (modifiedCount) guardados++;
          else omitidos++;
        }

        console.log(`Lote ${indice + 1}: ${lote.length} comentarios procesados`);
      } catch (error) {
        lotesFallidos++;
        console.error(`ERROR en el lote ${indice + 1}: ${error.message}`);
      }
    }

    console.log(`\nTerminado: ${guardados} ${opciones.dryRun ? "analizados" : "guardados"}, ${omitidos} omitidos, ${lotesFallidos} lotes con error.`);
  } finally {
    await conexion.close();
  }
}

main().catch((error) => {
  console.error("No se pudo completar el análisis:", error.message);
  process.exit(1);
});
