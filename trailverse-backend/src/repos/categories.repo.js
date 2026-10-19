const Category = require("../models/category.model");

const getAll = async (filtros = {}) => {
  return Category.find(filtros).sort({ name: 1 });
};

const getById = async (id) => {
  return Category.findById(id);
};

const getBySlug = async (slug) => {
  return Category.findOne({ slug });
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
  return Category.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
};

const deleteById = async (id) => {
  return Category.findByIdAndDelete(id);
};

module.exports = { getAll, getById, getBySlug, slugExists, create, update, deleteById };
