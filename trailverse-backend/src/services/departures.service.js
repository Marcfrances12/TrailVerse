const departuresRepo = require("../repos/departures.repo");
const Ruta = require("../models/ruta.model");
const AppError = require("../utils/AppError");
const { generateSku } = require("../utils/sku");
const { validarConZod } = require("../utils/validar");
const {
  idParamSchema,
  createDepartureSchema,
  updateDepartureSchema,
  skuSchema
} = require("../validators/departures.validator");
const integrity = require("./integrity.service");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function construirSkuUnico(rutaSlug) {
  const base = `DEP-${rutaSlug}`;
  let numero = (await departuresRepo.countByBase(base)) + 1;
  let sku = generateSku(rutaSlug, numero);
  while (await departuresRepo.skuExists(sku)) {
    numero += 1;
    sku = generateSku(rutaSlug, numero);
  }
  return validarConZod(skuSchema, sku, "body");
}

function validarInvariantes(datos) {
  if (datos.stock > datos.capacity) {
    throw AppError.badRequest("Error de validación", [
      { origen: "body", campo: "stock", mensaje: "El stock no puede superar la capacidad" }
    ]);
  }
  if (datos.endDate && datos.endDate < datos.startDate) {
    throw AppError.badRequest("Error de validación", [
      { origen: "body", campo: "endDate", mensaje: "La fecha de fin debe ser posterior a la de inicio" }
    ]);
  }
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
  const datosValidos = validarConZod(createDepartureSchema, datos, "body");
  await integrity.validarRelacionesDeparture(datosValidos);

  const ruta = await Ruta.findOne({
    _id: datosValidos.rutaId,
    isActive: true,
    deleted_at: null
  }).select("nombre slug");
  if (!ruta) throw AppError.badRequest("La ruta indicada no existe, está inactiva o se encuentra eliminada");

  const sku = await construirSkuUnico(ruta.slug);
  return departuresRepo.create({ ...datosValidos, sku });
}

async function updateDeparture(id, datos) {
  const idValido = await validarId(id);
  const datosValidos = validarConZod(updateDepartureSchema, datos, "body");
  const actual = await departuresRepo.getById(idValido);
  if (!actual) throw AppError.notFound("Salida no encontrada");

  const datosActuales = actual.toObject();
  const price = datosValidos.price
    ? { ...datosActuales.price, ...datosValidos.price }
    : datosActuales.price;
  const endDate = Object.hasOwn(datosValidos, "endDate") ? datosValidos.endDate : datosActuales.endDate;
  validarInvariantes({
    startDate: datosValidos.startDate ?? datosActuales.startDate,
    endDate,
    capacity: datosValidos.capacity ?? datosActuales.capacity,
    stock: datosValidos.stock ?? datosActuales.stock
  });

  const updateData = { ...datosValidos };
  if (datosValidos.price) updateData.price = price;
  const rutaActualId = String(datosActuales.rutaId?._id ?? datosActuales.rutaId);
  if (datosValidos.rutaId && String(datosValidos.rutaId) !== rutaActualId) {
    await integrity.validarRelacionesDeparture({ rutaId: datosValidos.rutaId });
    const ruta = await Ruta.findOne({ _id: datosValidos.rutaId, isActive: true, deleted_at: null }).select("slug");
    if (!ruta) throw AppError.badRequest("La ruta indicada no existe, está inactiva o se encuentra eliminada");
    updateData.sku = await construirSkuUnico(ruta.slug);
  }

  const departure = await departuresRepo.update(idValido, updateData);
  if (!departure) throw AppError.notFound("Salida no encontrada");
  return departure;
}

async function regenerarSkusRuta(rutaId, rutaSlug) {
  const departures = await departuresRepo.getByRuta(rutaId);
  for (const departure of departures) {
    const sku = await construirSkuUnico(rutaSlug);
    await departuresRepo.setSku(departure._id, sku);
  }
}

async function activateDeparture(id) {
  const idValido = await validarId(id);
  const actual = await departuresRepo.getRelationsById(idValido);
  if (!actual) throw AppError.notFound("Salida no encontrada");
  await integrity.validarRelacionesDeparture({ rutaId: actual.rutaId });
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
  const actual = await departuresRepo.getAnyById(idValido);
  if (!actual || actual.deleted_at == null) throw AppError.notFound("Salida no encontrada en la papelera");
  await integrity.validarRelacionesDeparture({ rutaId: actual.rutaId });
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
  hardDeleteDeparture,
  regenerarSkusRuta
};
