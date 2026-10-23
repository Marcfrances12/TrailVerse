const departuresRepo = require("../repos/departures.repo");
const Ruta = require("../models/ruta.model");
const AppError = require("../utils/AppError");
const { generateSku, generateSkuWithSequence } = require("../utils/sku");
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

async function baseSkuParaRuta(rutaId) {
  const ruta = await Ruta.findById(rutaId)
    .select("dificultad distanciaKm locationId")
    .populate("locationId", "nombre provincia");

  if (!ruta) throw AppError.notFound("No se puede generar el SKU: ruta no encontrada");
  if (!ruta.locationId || typeof ruta.locationId !== "object") {
    throw AppError.badRequest("No se puede generar el SKU: la ruta no tiene una localización disponible");
  }

  try {
    return generateSku({
      nombreLocalizacion: ruta.locationId.nombre,
      provincia: ruta.locationId.provincia,
      dificultad: ruta.dificultad,
      distanciaKm: ruta.distanciaKm
    });
  } catch (error) {
    throw AppError.badRequest(error.message);
  }
}

async function skuUnicoDesdeBase(base, { excludeIds = [], reservados = new Set() } = {}) {
  if (!reservados.has(base) && !(await departuresRepo.skuBaseExists(base, excludeIds))) {
    return validarConZod(skuSchema, base, "body");
  }

  let numero = 1;
  while (true) {
    const candidato = generateSkuWithSequence(base, numero);
    if (!reservados.has(candidato) && !(await departuresRepo.skuExists(candidato, excludeIds))) {
      return validarConZod(skuSchema, candidato, "body");
    }
    numero += 1;
  }
}

async function generarSkuUnicoParaRuta(rutaId, excludeId) {
  const base = await baseSkuParaRuta(rutaId);
  return skuUnicoDesdeBase(base, { excludeIds: excludeId ? [excludeId] : [] });
}

async function regenerarSkusRuta(rutaId) {
  const departures = await departuresRepo.getByRuta(rutaId);
  if (departures.length === 0) return 0;

  const base = await baseSkuParaRuta(rutaId);
  const baseActualDe = (sku) => typeof sku === "string" ? sku.replace(/-\d{3,}$/, "") : "";
  const yaAlineadas = departures.filter((departure) => baseActualDe(departure.sku) === base);
  const porActualizar = departures.filter((departure) => !yaAlineadas.includes(departure));
  if (porActualizar.length === 0) return 0;

  const idsPorActualizar = porActualizar.map((departure) => departure._id);
  const reservados = new Set(yaAlineadas.map((departure) => departure.sku));
  for (const departure of porActualizar) {
    const sku = await skuUnicoDesdeBase(base, { excludeIds: idsPorActualizar, reservados });
    await departuresRepo.setSku(departure._id, sku);
    reservados.add(sku);
  }
  return porActualizar.length;
}

async function regenerarSkusLocalizacion(locationId) {
  const rutas = await Ruta.find({ locationId }).select("_id").lean();
  for (const ruta of rutas) await regenerarSkusRuta(ruta._id);
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
  const sku = await generarSkuUnicoParaRuta(datosValidos.rutaId);
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
    : datosActuales.price; i
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
    updateData.sku = await generarSkuUnicoParaRuta(datosValidos.rutaId, idValido);
  }

  const departure = await departuresRepo.update(idValido, updateData);
  if (!departure) throw AppError.notFound("Salida no encontrada");
  return departure;
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
  regenerarSkusRuta,
  regenerarSkusLocalizacion
};
