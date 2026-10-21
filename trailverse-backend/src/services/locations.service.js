const locationsRepo = require("../repos/locations.repo");
const AppError = require("../utils/AppError");
const { generateSlug } = require("../utils/slug");
const { validarConZod } = require("../utils/validar");
const escapeRegex = require("../utils/escapeRegex");
const { idParamSchema } = require("../validators/rutas.validator");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function construirSlugUnico(nombre) {
  const base = generateSlug(nombre);
  let candidato = base;
  let contador = 2;
  while (await locationsRepo.slugExists(candidato)) {
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

async function createLocation(datos) {
  const slug = await construirSlugUnico(datos.nombre);
  return locationsRepo.create({ ...datos, slug });
}

async function updateLocation(id, datos) {
  const idValido = await validarId(id);
  if (datos.nombre) {
    datos.slug = await construirSlugUnico(datos.nombre);
  }
  const location = await locationsRepo.update(idValido, datos);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
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
  const location = await locationsRepo.setActive(idValido, false);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

async function deleteLocation(id) {
  const idValido = await validarId(id);
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
  const location = await locationsRepo.hardDelete(idValido);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

module.exports = {
  getLocations,
  getLocationsEliminadas,
  getLocationById,
  createLocation,
  updateLocation,
  activateLocation,
  deactivateLocation,
  deleteLocation,
  restoreLocation,
  hardDeleteLocation
};
