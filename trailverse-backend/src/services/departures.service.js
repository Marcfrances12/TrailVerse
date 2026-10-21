const departuresRepo = require("../repos/departures.repo");
const Ruta = require("../models/ruta.model");
const AppError = require("../utils/AppError");
const { generateSku } = require("../utils/sku");
const { validarConZod } = require("../utils/validar");
const { idParamSchema } = require("../validators/rutas.validator");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function construirSkuUnico(ruta) {
  const base = `DEP-${ruta.slug}`;
  let numero = (await departuresRepo.countByBase(base)) + 1;
  let sku = generateSku(ruta.slug, numero);
  while (await departuresRepo.skuExists(sku)) {
    numero += 1;
    sku = generateSku(ruta.slug, numero);
  }
  return sku;
}

async function getDepartures(query = {}) {
  const filtros = {};
  if (query.rutaId) filtros.rutaId = query.rutaId;
  if (query.status) filtros.status = query.status;
  if (query.isActive !== undefined) filtros.isActive = query.isActive;
  return departuresRepo.getAll(filtros);
}

async function getDeparturesEliminados() {
  return departuresRepo.getDeleted();
}

async function getDepartureById(id) {
  const idValido = await validarId(id);
  const departure = await departuresRepo.getById(idValido);
  if (!departure) throw AppError.notFound("Salida no encontrada");
  return departure;
}

async function createDeparture(datos) {
  const ruta = await Ruta.findOne({ _id: datos.rutaId, deleted_at: null }).select("nombre slug");
  if (!ruta) throw AppError.badRequest("La ruta indicada no existe");

  const sku = await construirSkuUnico(ruta);
  return departuresRepo.create({ ...datos, sku });
}

async function updateDeparture(id, datos) {
  const idValido = await validarId(id);
  const departure = await departuresRepo.update(idValido, datos);
  if (!departure) throw AppError.notFound("Salida no encontrada");
  return departure;



  const datosValidos = validarConZod(updateRutaSchema, datos, "body");

  const rutaActual = await rutasRepo.getById(idValido);

  if (!rutaActual) {
    throw AppError.notFound("Ruta no encontrada");
  }


  // construirSkuUnico

  //validate relations

  //validate stock price capacity


  const { images, ...resto } = datosValidos;

  // Si se envían imágenes, la primera pasa a ser la portada.
  if (Array.isArray(images)) {
    resto.coverImage = portadaDe(images, rutaActual.coverImage);
  }

  const ruta = await rutasRepo.update(idValido, resto);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }
}

async function activateDeparture(id) {
  const idValido = await validarId(id);
  const departure = await departuresRepo.setActive(idValido, true);
  if (!departure) throw AppError.notFound("Salida no encontrada");
  return departure;
}

async function deactivateDeparture(id) {
  const idValido = await validarId(id);
  const departure = await departuresRepo.setActive(idValido, false);
  if (!departure) throw AppError.notFound("Salida no encontrada");
  return departure;
}

async function deleteDeparture(id) {
  const idValido = await validarId(id);
  const departure = await departuresRepo.softDelete(idValido);
  if (!departure) throw AppError.notFound("Salida no encontrada");
  return departure;
}

async function restoreDeparture(id) {
  const idValido = await validarId(id);
  const departure = await departuresRepo.restore(idValido);
  if (!departure) throw AppError.notFound("Salida no encontrada en la papelera");
  return departure;
}

async function hardDeleteDeparture(id) {
  const idValido = await validarId(id);
  const departure = await departuresRepo.hardDelete(idValido);
  if (!departure) throw AppError.notFound("Salida no encontrada");
  return departure;
}

module.exports = {
  getDepartures,
  getDeparturesEliminados,
  getDepartureById,
  createDeparture,
  updateDeparture,
  activateDeparture,
  deactivateDeparture,
  deleteDeparture,
  restoreDeparture,
  hardDeleteDeparture
};
