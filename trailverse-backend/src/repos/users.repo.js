const User = require("../models/user.model");

const noBorrados = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return User.find({ ...filtros, ...noBorrados }).sort({ name: 1 });
};

const getDeleted = async () => {
  return User.find({ deleted_at: { $ne: null } }).sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return User.findOne({ _id: id, ...noBorrados }).populate("roleId", "name permissions");
};

const getByEmail = async (email) => {
  return User.findOne({ email, ...noBorrados });
};

const emailExists = async (email, excludeId) => {
  const filtro = { email };
  if (excludeId) filtro._id = { $ne: excludeId };
  const existe = await User.exists(filtro);
  return Boolean(existe);
};

const create = async (datos) => {
  return User.create(datos);
};

const update = async (id, datos) => {
  return User.findOneAndUpdate({ _id: id, ...noBorrados }, datos, {
    new: true,
    runValidators: true
  }).populate("roleId", "name permissions");
};

const setActive = async (id, isActive) => {
  return User.findOneAndUpdate({ _id: id, ...noBorrados }, { isActive }, { new: true });
};

const softDelete = async (id) => {
  return User.findOneAndUpdate(
    { _id: id, ...noBorrados },
    { deleted_at: new Date(), isActive: false },
    { new: true }
  );
};

module.exports = { getAll, getDeleted, getById, getByEmail, emailExists, create, update, setActive, softDelete };
