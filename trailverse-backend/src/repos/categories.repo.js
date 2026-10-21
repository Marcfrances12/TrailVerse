const Category = require("../models/category.model");

const noBorradas = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return Category.find({ ...filtros, ...noBorradas }).sort({ name: 1 });
};

const getDeleted = async () => {
  return Category.find({ deleted_at: { $ne: null } }).sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return Category.findOne({ _id: id, ...noBorradas });
};

const getBySlug = async (slug) => {
  return Category.findOne({ slug, ...noBorradas });
};

const slugExists = async (slug, excludeId) => {
  const filtro = { slug };
  if (excludeId) filtro._id = { $ne: excludeId };
  const existe = await Category.exists(filtro);
  return Boolean(existe);
};

const create = async (datos) => {
  return Category.create(datos);
};

const update = async (id, datos) => {
  return Category.findOneAndUpdate({ _id: id, ...noBorradas }, datos, {
    new: true,
    runValidators: true
  });
};

const setActive = async (id, isActive) => {
  return Category.findOneAndUpdate({ _id: id, ...noBorradas }, { isActive }, { new: true });
};

const softDelete = async (id) => {
  return Category.findOneAndUpdate(
    { _id: id, ...noBorradas },
    { deleted_at: new Date(), isActive: false },
    { new: true }
  );
};

const restore = async (id) => {
  return Category.findOneAndUpdate(
    { _id: id, deleted_at: { $ne: null } },
    { deleted_at: null, isActive: true },
    { new: true }
  );
};

const hardDelete = async (id) => {
  return Category.findByIdAndDelete(id);
};

module.exports = { getAll, getDeleted, getById, getBySlug, slugExists, create, update, setActive, softDelete, restore, hardDelete };
