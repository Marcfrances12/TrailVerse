const { obtenerRutaPublica } = require("./route-data");
const { generarValoracion } = require("./comentarios-ia");
const { TTLCache } = require("./cache");
const { env } = require("../config/env");
const Comment = require("../models/comment.readonly.model");

const MIN_COMENTARIOS = 3;
const MAX_COMENTARIOS_IA = 60;
const TTL_CACHE_MS = 24 * 60 * 60 * 1000;
const TTL_ERROR_MS = 2 * 60 * 1000;

const AVISO = "Resumen generado con IA a partir de los comentarios de los clientes. Puede no reflejar todas las opiniones.";

// La clave cambia en cuanto se publica, edita o borra un comentario: así el resumen
// solo se regenera cuando hay cambios y no en cada visita.
const cache = new TTLCache({ ttlMs: TTL_CACHE_MS, maxEntries: 500 });
const fallos = new TTLCache({ ttlMs: TTL_ERROR_MS, maxEntries: 500 });
const enCurso = new Map();

async function estadoComentarios(rutaId) {
  const [resultado] = await Comment.aggregate([
    { $match: { rutaId, deleted_at: null } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        media: { $avg: "$valoracion" },
        ultimoCambio: { $max: "$updated_at" }
      }
    }
  ]);
  return resultado ?? { total: 0, media: null, ultimoCambio: null };
}

function claveDe(rutaId, estado) {
  return `${rutaId}:${estado.total}:${estado.ultimoCambio ? new Date(estado.ultimoCambio).getTime() : 0}`;
}

function candidatos(llm) {
  // Solo el proveedor principal: el respaldo gratuito puede usar los datos para entrenar
  // y los comentarios son contenido de los usuarios.
  return [env.LLM_MODEL, env.LLM_FALLBACK_MODEL].filter((modelo, i, lista) => modelo && lista.indexOf(modelo) === i)
    .map((model) => ({ llm, model }));
}

async function generar(ruta, { llm }) {
  const comentarios = await Comment.find({ rutaId: ruta._id, deleted_at: null })
    .select("texto valoracion")
    .sort({ created_at: -1 })
    .limit(MAX_COMENTARIOS_IA)
    .lean();

  let ultimoError;
  for (const candidato of candidatos(llm)) {
    try {
      return { ...(await generarValoracion(ruta, comentarios, candidato)), basadoEn: comentarios.length };
    } catch (error) {
      ultimoError = error;
    }
  }
  throw ultimoError ?? new Error("No hay modelo configurado");
}

// Resumen de valoración de una ruta pública. null si la ruta no existe.
// Si la IA falla, devuelve la media y el total sin resumen (no rompe el detalle).
async function obtenerValoracion(rutaId, { llm }) {
  const ruta = await obtenerRutaPublica(rutaId);
  if (!ruta) return null;

  const estado = await estadoComentarios(ruta._id);
  const base = {
    ruta: { id: String(ruta._id), nombre: ruta.nombre, slug: ruta.slug },
    total: estado.total,
    media: estado.media == null ? null : Math.round(estado.media * 10) / 10,
    minimo: MIN_COMENTARIOS,
    suficientes: estado.total >= MIN_COMENTARIOS,
    resumen: null,
    positivos: [],
    negativos: [],
    basadoEn: 0,
    generadoEn: null,
    disponible: true,
    aviso: AVISO
  };

  if (!base.suficientes) return base;

  const clave = claveDe(String(ruta._id), estado);
  const guardado = cache.get(clave);
  if (guardado) return { ...base, ...guardado };
  if (fallos.get(clave)) return { ...base, disponible: false };

  // Si llegan varias visitas a la vez, solo una llama al modelo.
  if (!enCurso.has(clave)) {
    enCurso.set(
      clave,
      generar(ruta, { llm })
        .then((ia) => {
          const valor = { ...ia, generadoEn: new Date().toISOString() };
          cache.set(clave, valor);
          return valor;
        })
        .finally(() => enCurso.delete(clave))
    );
  }

  try {
    return { ...base, ...(await enCurso.get(clave)) };
  } catch (error) {
    console.error("[valoracion] no se pudo generar el resumen:", error.status ?? "", error.message);
    fallos.set(clave, true);
    return { ...base, disponible: false };
  }
}

module.exports = { obtenerValoracion, claveDe, MIN_COMENTARIOS };
