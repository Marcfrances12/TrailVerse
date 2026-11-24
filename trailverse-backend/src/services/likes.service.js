const likesRepo = require("../repos/likes.repo");
const shopRepo = require("../repos/shop.repo");
const shopService = require("./shop.service");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { slugParamSchema } = require("../validators/likes.validator");

const MENSAJE_DUPLICADO = "Ya has dado like a esta ruta";

// Solo se puede interactuar con rutas publicadas, activas y no borradas.
async function rutaVisible(slug) {
  const slugValido = validarConZod(slugParamSchema, { slug }, "params").slug;
  const ruta = await shopRepo.idDeRutaVisible(slugValido);
  if (!ruta) throw AppError.notFound("Ruta no encontrada");
  return ruta;
}

async function estado(rutaId, userId) {
  const [total, likedByMe] = await Promise.all([
    likesRepo.contarDeRuta(rutaId),
    userId ? likesRepo.existe(userId, rutaId) : false
  ]);
  return { total, likedByMe };
}

async function getEstado(slug, userId = null) {
  const ruta = await rutaVisible(slug);
  return estado(ruta._id, userId);
}

async function darLike(slug, userId) {
  const ruta = await rutaVisible(slug);

  if (await likesRepo.existe(userId, ruta._id)) throw AppError.conflict(MENSAJE_DUPLICADO);

  try {
    await likesRepo.crear(userId, ruta._id);
  } catch (error) {
    // Dos peticiones simultáneas pueden pasar la comprobación anterior:
    // el índice único lo frena y se responde con el mismo 409.
    if (error?.code === 11000) throw AppError.conflict(MENSAJE_DUPLICADO);
    throw error;
  }

  return estado(ruta._id, userId);
}

async function quitarLike(slug, userId) {
  const ruta = await rutaVisible(slug);

  const eliminado = await likesRepo.eliminar(userId, ruta._id);
  if (!eliminado) throw AppError.notFound("No has dado like a esta ruta");

  return estado(ruta._id, userId);
}

// Rutas que le gustan al usuario, de la más reciente a la más antigua.
// Las rutas que ya no son visibles no se muestran, pero el like se conserva.
async function getMisLikes(userId) {
  const rutaIds = await likesRepo.rutaIdsDeUsuario(userId);
  const rutas = await shopRepo.rutasVisiblesPorIds(rutaIds);

  const posicion = new Map(rutaIds.map((id, indice) => [String(id), indice]));
  rutas.sort((a, b) => posicion.get(String(a._id)) - posicion.get(String(b._id)));

  return shopService.enriquecerRutas(rutas);
}

module.exports = { getEstado, darLike, quitarLike, getMisLikes, MENSAJE_DUPLICADO };
