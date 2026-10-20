const Departure = require("../models/departure.model");
const escapeRegex = require("../utils/escapeRegex");

const noBorrados = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return Departure.find({ ...filtros, ...noBorrados })
    .populate("rutaId", "nombre slug")
    .sort({ startDate: 1 });
};

const getDeleted = async () => {
  return Departure.find({ deleted_at: { $ne: null } })
    .populate("rutaId", "nombre slug")
    .sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return Departure.findOne({ _id: id, ...noBorrados }).populate("rutaId", "nombre slug");
};

const skuExists = async (sku, excludeId) => {
  const filtro = { sku };
  if (excludeId) filtro._id = { $ne: excludeId };
  return Boolean(await Departure.exists(filtro));
};

const countByBase = async (base) => {
  const regex = new RegExp(`^${escapeRegex(base)}-\\d{3,}$`);
  return Departure.countDocuments({ sku: regex });
};

const create = async (datos) => {
  return Departure.create(datos);
};

const update = async (id, datos) => {
  return Departure.findOneAndUpdate({ _id: id, ...noBorrados }, datos, {
    new: true,
    runValidators: true
  }).populate("rutaId", "nombre slug");
};

const setActive = async (id, isActive) => {
  return Departure.findOneAndUpdate({ _id: id, ...noBorrados }, { isActive }, { new: true });
};

const softDelete = async (id) => {
  return Departure.findOneAndUpdate(
    { _id: id, ...noBorrados },
    { deleted_at: new Date(), isActive: false },
    { new: true }
  );
};

module.exports = {
  getAll,
  getDeleted,
  getById,
  skuExists,
  countByBase,
  create,
  update,
  setActive,
  softDelete
};
