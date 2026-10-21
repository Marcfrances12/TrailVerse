const Role = require("../models/role.model");

const noBorrados = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return Role.find({ ...filtros, ...noBorrados }).sort({ name: 1 });
};

const getDeleted = async () => {
  return Role.find({ deleted_at: { $ne: null } }).sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return Role.findOne({ _id: id, ...noBorrados });
};

const getByName = async (name) => {
  return Role.findOne({ name, ...noBorrados });
};

const nameExists = async (name, excludeId) => {
  const filtro = { name };
  if (excludeId) filtro._id = { $ne: excludeId };
  return Boolean(await Role.exists(filtro));
};

const create = async (datos) => {
  return Role.create(datos);
};

const update = async (id, datos) => {
  return Role.findOneAndUpdate({ _id: id, ...noBorrados }, datos, {
    new: true,
    runValidators: true
  });
};

const setActive = async (id, isActive) => {
  return Role.findOneAndUpdate({ _id: id, ...noBorrados }, { isActive }, { new: true });
};

const softDelete = async (id) => {
  return Role.findOneAndUpdate(
    { _id: id, ...noBorrados },
    { deleted_at: new Date(), isActive: false },
    { new: true }
  );
};

const restore = async (id) => {
  return Role.findOneAndUpdate(
    { _id: id, deleted_at: { $ne: null } },
    { deleted_at: null, isActive: true },
    { new: true }
  );
};

const hardDelete = async (id) => {
  return Role.findByIdAndDelete(id);
};

module.exports = { getAll, getDeleted, getById, getByName, nameExists, create, update, setActive, softDelete, restore, hardDelete };
