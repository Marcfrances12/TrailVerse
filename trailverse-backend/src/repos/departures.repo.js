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

const getBySku = async (sku) => {
  return Departure.findOne({ sku, ...noBorrados }).populate("rutaId", "nombre slug");
};

const getAnyById = async (id) => {
  return Departure.findById(id);
};

const getRelationsById = async (id) => {
  return Departure.findOne({ _id: id, ...noBorrados }).select("rutaId");
};

const getByRuta = async (rutaId) => {
  return Departure.find({ rutaId }).sort({ created_at: 1, _id: 1 });
};

const setSku = async (id, sku) => {
  return Departure.updateOne({ _id: id }, { $set: { sku } });
};

const skuExists = async (sku, excludeIds) => {
  const filtro = { sku };
  const ids = (Array.isArray(excludeIds) ? excludeIds : [excludeIds]).filter(Boolean);
  if (ids.length === 1) filtro._id = { $ne: ids[0] };
  if (ids.length > 1) filtro._id = { $nin: ids };
  return Boolean(await Departure.exists(filtro));
};

const skuBaseExists = async (base, excludeIds) => {
  const filtro = { sku: new RegExp(`^${escapeRegex(base)}(?:-\\d{3,})?$`) };
  const ids = (Array.isArray(excludeIds) ? excludeIds : [excludeIds]).filter(Boolean);
  if (ids.length === 1) filtro._id = { $ne: ids[0] };
  if (ids.length > 1) filtro._id = { $nin: ids };
  return Boolean(await Departure.exists(filtro));
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

const restore = async (id) => {
  return Departure.findOneAndUpdate(
    { _id: id, deleted_at: { $ne: null } },
    { deleted_at: null, isActive: true },
    { new: true }
  ).populate("rutaId", "nombre slug");
};

const hardDelete = async (id) => {
  return Departure.findByIdAndDelete(id);
};

module.exports = {
  getAll,
  getDeleted,
  getById,
  getBySku,
  getAnyById,
  getRelationsById,
  getByRuta,
  setSku,
  skuExists,
  skuBaseExists,
  create,
  update,
  setActive,
  softDelete,
  restore,
  hardDelete
};
