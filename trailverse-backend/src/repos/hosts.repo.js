const Host = require("../models/host.model");

const noBorrados = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return Host.find({ ...filtros, ...noBorrados }).sort({ name: 1 });
};

const getDeleted = async () => {
  return Host.find({ deleted_at: { $ne: null } }).sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return Host.findOne({ _id: id, ...noBorrados }).populate("userId", "name email");
};

const getAnyById = async (id) => {
  return Host.findById(id);
};

const getRelationsById = async (id) => {
  return Host.findOne({ _id: id, ...noBorrados }).select("userId");
};

const getBySlug = async (slug) => {
  return Host.findOne({ slug, ...noBorrados }).populate("userId", "name email");
};

const slugExists = async (slug, excludeId) => {
  const filtro = { slug };
  if (excludeId) filtro._id = { $ne: excludeId };
  const existe = await Host.exists(filtro);
  return Boolean(existe);
};

const create = async (datos) => {
  return Host.create(datos);
};

const update = async (id, datos) => {
  return Host.findOneAndUpdate({ _id: id, ...noBorrados }, datos, {
    new: true,
    runValidators: true
  }).populate("userId", "name email");
};

const setActive = async (id, isActive) => {
  return Host.findOneAndUpdate({ _id: id, ...noBorrados }, { isActive }, { new: true });
};

const softDelete = async (id) => {
  return Host.findOneAndUpdate(
    { _id: id, ...noBorrados },
    { deleted_at: new Date(), isActive: false },
    { new: true }
  );
};

const restore = async (id) => {
  return Host.findOneAndUpdate(
    { _id: id, deleted_at: { $ne: null } },
    { deleted_at: null, isActive: true },
    { new: true }
  ).populate("userId", "name email");
};

const hardDelete = async (id) => {
  return Host.findByIdAndDelete(id);
};

module.exports = { getAll, getDeleted, getById, getAnyById, getRelationsById, getBySlug, slugExists, create, update, setActive, softDelete, restore, hardDelete };
