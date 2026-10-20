const Location = require("../models/location.model");

const noBorradas = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return Location.find({ ...filtros, ...noBorradas }).sort({ nombre: 1 });
};

const getDeleted = async () => {
  return Location.find({ deleted_at: { $ne: null } }).sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return Location.findOne({ _id: id, ...noBorradas });
};

const slugExists = async (slug, excludeId) => {
  const filtro = { slug };
  if (excludeId) filtro._id = { $ne: excludeId };
  const existe = await Location.exists(filtro);
  return Boolean(existe);
};

const create = async (datos) => {
  return Location.create(datos);
};

const update = async (id, datos) => {
  return Location.findOneAndUpdate({ _id: id, ...noBorradas }, datos, {
    new: true,
    runValidators: true
  });
};

const setActive = async (id, isActive) => {
  return Location.findOneAndUpdate({ _id: id, ...noBorradas }, { isActive }, { new: true });
};

const softDelete = async (id) => {
  return Location.findOneAndUpdate(
    { _id: id, ...noBorradas },
    { deleted_at: new Date(), isActive: false },
    { new: true }
  );
};

module.exports = { getAll, getDeleted, getById, slugExists, create, update, setActive, softDelete };
