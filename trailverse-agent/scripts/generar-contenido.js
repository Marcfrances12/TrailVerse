// Genera contenido de IA para las rutas y lo guarda en la colección `rutas`.
//   --tipo=faqs (por defecto): preguntas frecuentes, en el campo `faqs`.
//   --tipo=guia: lugares cercanos (OpenStreetMap) y resumen con IA, en el campo `guiaIA`.
// Uso: npm run faqs:generar | npm run guia:generar -- [--slug=ruta-del-pou-clar] [--sobrescribir] [--dry-run]
//   --slug         solo esa ruta (por defecto, todas las publicadas que aún no lo tienen)
//   --sobrescribir reemplaza el contenido existente
//   --dry-run      muestra el resultado en consola sin guardarlo

const mongoose = require("mongoose");
const { default: OpenAI } = require("openai");
const { env } = require("../src/config/env");
const { generarFaqs } = require("../src/agent/faq-generator");
const { generarGuiaLugares } = require("../src/agent/guia-generator");

const PAUSA_ENTRE_RUTAS_MS = 8000;
const TIMEOUT_GENERACION_MS = 120000;
const TIPOS = ["faqs", "guia"];

function leerArgumentos(argv) {
  const opciones = { tipo: "faqs", slug: null, sobrescribir: false, dryRun: false };

  for (const argumento of argv) {
    if (argumento.startsWith("--tipo=")) opciones.tipo = argumento.slice("--tipo=".length);
    else if (argumento.startsWith("--slug=")) opciones.slug = argumento.slice("--slug=".length);
    else if (argumento === "--sobrescribir") opciones.sobrescribir = true;
    else if (argumento === "--dry-run") opciones.dryRun = true;
    else throw new Error(`Argumento desconocido: ${argumento}`);
  }

  if (!TIPOS.includes(opciones.tipo)) throw new Error(`--tipo debe ser ${TIPOS.join(" o ")}`);
  return opciones;
}

function filtroPara(opciones) {
  const filtro = { status: "published", isActive: true, deleted_at: null };
  if (opciones.slug) filtro.slug = opciones.slug;

  if (opciones.tipo === "guia") {
    filtro["startPoint.coordinates"] = { $exists: true };
    if (!opciones.sobrescribir) filtro.$or = [{ guiaIA: { $exists: false } }, { guiaIA: null }];
  } else if (!opciones.sobrescribir) {
    filtro.$or = [{ faqs: { $exists: false } }, { faqs: { $size: 0 } }];
  }

  return filtro;
}

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function generarPara(tipo, ruta, conexion, llm) {
  if (tipo === "faqs") {
    if (ruta.locationId) {
      ruta.locationId = await conexion.collection("locations").findOne({ _id: ruta.locationId });
    }
    const faqs = await generarFaqs(ruta, { llm, model: env.FAQ_LLM_MODEL });
    return { contenido: faqs, campo: "faqs", resumen: `${faqs.length} FAQs` };
  }

  const guia = await generarGuiaLugares(ruta, { llm, model: env.FAQ_LLM_MODEL });
  const lugares = guia.lugares.reduce((total, grupo) => total + grupo.resultados.length, 0);
  return { contenido: guia, campo: "guiaIA", resumen: `${lugares} lugares en ${guia.lugares.length} categorías` };
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
    const rutas = await conexion.collection("rutas").find(filtroPara(opciones)).toArray();
    console.log(`Tipo ${opciones.tipo}: ${rutas.length} rutas a procesar (modelo ${env.FAQ_LLM_MODEL})`);

    let correctas = 0;
    let fallidas = 0;

    for (const [indice, ruta] of rutas.entries()) {
      if (indice > 0) await esperar(PAUSA_ENTRE_RUTAS_MS);

      try {
        const { contenido, campo, resumen } = await generarPara(opciones.tipo, ruta, conexion, llm);

        if (opciones.dryRun) {
          console.log(`\n# ${ruta.slug}\n${JSON.stringify(contenido, null, 2)}`);
        } else {
          await conexion.collection("rutas").updateOne({ _id: ruta._id }, { $set: { [campo]: contenido } });
          console.log(`OK ${ruta.slug}: ${resumen} guardadas`);
        }
        correctas++;
      } catch (error) {
        fallidas++;
        console.error(`ERROR ${ruta.slug}: ${error.message}`);
      }
    }

    console.log(`\nTerminado: ${correctas} correctas, ${fallidas} con error.`);
  } finally {
    await conexion.close();
  }
}

main().catch((error) => {
  console.error("No se pudo completar la generación:", error.message);
  process.exit(1);
});
