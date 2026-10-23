const imagesRepo = require("../repos/images.repo");
const { validarConZod } = require("../utils/validar");
const { imagenesSchema } = require("../validators/rutas.validator");

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

  const imagenesValidas = validarConZod(imagenesSchema, imagenes, "body");

  await imagesRepo.deleteByEntity(ENTIDAD, entidadId);

  const creadas = await imagesRepo.createMany(ENTIDAD, entidadId, imagenesValidas);

  return creadas;
}

async function obtenerImagenes(entidadId) {
  return imagesRepo.getByEntity(ENTIDAD, entidadId);
}

async function eliminarImagenes(entidadId) {
  return imagesRepo.deleteByEntity(ENTIDAD, entidadId);
}

module.exports = { guardarImagenes, obtenerImagenes, eliminarImagenes };
