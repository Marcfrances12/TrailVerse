const locationsRepo = require("../repos/locations.repo");
const AppError = require("../utils/AppError");
const { generateSlug } = require("../utils/slug");
const { validarConZod } = require("../utils/validar");
const escapeRegex = require("../utils/escapeRegex");
const { idParamSchema, slugParamSchema, createLocationSchema, updateLocationSchema } = require("../validators/locations.validator");
const integrity = require("./integrity.service");
const departuresService = require("./departures.service");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function construirSlugUnico(nombre, excludeId) {
  const base = generateSlug(nombre);
  let candidato = base;
  let contador = 2;
  while (await locationsRepo.slugExists(candidato, excludeId)) {
    candidato = `${base}-${contador}`;
    contador += 1;
  }
  return candidato;
}

async function getLocations(query = {}) {
  const filtros = {};
  if (query.provincia) filtros.provincia = new RegExp(escapeRegex(query.provincia), "i");
  if (query.isActive !== undefined) filtros.isActive = query.isActive;
  return locationsRepo.getAll(filtros);
}

async function getLocationsEliminadas() {
  return locationsRepo.getDeleted();
}

async function getLocationById(id) {
  const idValido = await validarId(id);
  const location = await locationsRepo.getById(idValido);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

async function getLocationBySlug(slug) {
  const slugValido = validarConZod(slugParamSchema, { slug }, "params").slug;
  const location = await locationsRepo.getBySlug(slugValido);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

async function createLocation(datos) {
  const datosValidos = validarConZod(createLocationSchema, datos, "body");
  const slug = await construirSlugUnico(datosValidos.nombre);
  return locationsRepo.create({ ...datosValidos, slug });
}

async function updateLocation(id, datos) {
  const idValido = await validarId(id);
  const datosValidos = validarConZod(updateLocationSchema, datos, "body");
  const actual = await locationsRepo.getById(idValido);
  if (!actual) throw AppError.notFound("Ubicación no encontrada");

  const atributosSkuCambiados =
    (datosValidos.nombre !== undefined && datosValidos.nombre !== actual.nombre) ||
    (datosValidos.provincia !== undefined && datosValidos.provincia !== actual.provincia);
  const updateData = { ...datosValidos };
  if (datosValidos.nombre && datosValidos.nombre !== actual.nombre) {
    updateData.slug = await construirSlugUnico(datosValidos.nombre, idValido);
  }
  const location = await locationsRepo.update(idValido, updateData);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  if (atributosSkuCambiados) {
    await departuresService.regenerarSkusLocalizacion(idValido);
  }
  return location;
}

async function activateLocation(id) {
  const idValido = await validarId(id);
  const location = await locationsRepo.setActive(idValido, true);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

async function deactivateLocation(id) {
  const idValido = await validarId(id);
  await integrity.comprobarSinReferencias("location", idValido, "desactivar");
  const location = await locationsRepo.setActive(idValido, false);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

async function deleteLocation(id) {
  const idValido = await validarId(id);
  await integrity.comprobarSinReferencias("location", idValido, "eliminar lógicamente");
  const location = await locationsRepo.softDelete(idValido);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

async function restoreLocation(id) {
  const idValido = await validarId(id);
  const location = await locationsRepo.restore(idValido);
  if (!location) throw AppError.notFound("Ubicación no encontrada en la papelera");
  return location;
}

async function hardDeleteLocation(id) {
  const idValido = await validarId(id);
  await integrity.comprobarBorradoDefinitivo("location", idValido);
  const location = await locationsRepo.hardDelete(idValido);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

module.exports = {
  getLocations,
  getLocationsEliminadas,
  getLocationById,
  getLocationBySlug,
  createLocation,
  updateLocation,
  activateLocation,
  deactivateLocation,
  deleteLocation,
  restoreLocation,
  hardDeleteLocation
};
