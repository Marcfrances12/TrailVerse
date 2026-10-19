const locationsRepo = require("../repos/locations.repo");
const AppError = require("../utils/AppError");
const { idParamSchema } = require("../validators/rutas.validator");
const { validarConZod } = require("../utils/validar");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function getLocations(query = {}) {
  const filtros = {};
  if (query.provincia) filtros.provincia = new RegExp(query.provincia, "i");
  return locationsRepo.getAll(filtros);
}

async function getLocationById(id) {
  const idValido = await validarId(id);
  const location = await locationsRepo.getById(idValido);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

async function createLocation(datos) {
  return locationsRepo.create(datos);
}

async function updateLocation(id, datos) {
  const idValido = await validarId(id);
  const location = await locationsRepo.update(idValido, datos);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

async function deleteLocation(id) {
  const idValido = await validarId(id);
  const location = await locationsRepo.deleteById(idValido);
  if (!location) throw AppError.notFound("Ubicación no encontrada");
  return location;
}

module.exports = { getLocations, getLocationById, createLocation, updateLocation, deleteLocation };
