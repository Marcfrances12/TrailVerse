const imagesRepo = require("../repos/images.repo");
const AppError = require("../utils/AppError");

// Entidad principal que usa el catálogo de imágenes ahora mismo.
const ENTIDAD = "ruta";

/**
 * Sustituye todas las imágenes de una entidad por las indicadas.
 * Si no se pasan imágenes, se dejan las existentes intactas.
 */
async function guardarImagenes(entidadId, imagenes) {
  if (imagenes === undefined) {
    return obtenerImagenes(entidadId);
  }

  if (!Array.isArray(imagenes)) {
    throw AppError.badRequest("images debe ser un array de imágenes");
  }

  await imagesRepo.deleteByEntity(ENTIDAD, entidadId);

  const creadas = await imagesRepo.createMany(ENTIDAD, entidadId, imagenes);

  return creadas;
}

async function obtenerImagenes(entidadId) {
  return imagesRepo.getByEntity(ENTIDAD, entidadId);
}

async function eliminarImagenes(entidadId) {
  return imagesRepo.deleteByEntity(ENTIDAD, entidadId);
}

module.exports = { guardarImagenes, obtenerImagenes, eliminarImagenes };
