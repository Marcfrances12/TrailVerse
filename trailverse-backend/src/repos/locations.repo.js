const Location = require("../models/location.model");

const getAll = async (filtros = {}) => {
  return Location.find(filtros).sort({ nombre: 1 });
};

const getById = async (id) => {
  return Location.findById(id);
};

const create = async (datos) => {
  return Location.create(datos);
};

const update = async (id, datos) => {
  return Location.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
};

const deleteById = async (id) => {
  return Location.findByIdAndDelete(id);
};

module.exports = { getAll, getById, create, update, deleteById };
