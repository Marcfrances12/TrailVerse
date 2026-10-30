const User = require("../models/user.model");

const noBorrados = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return User.find({ ...filtros, ...noBorrados })
    .populate("roleId", "name permissions")
    .populate("profile", "name")
    .sort({ email: 1 });
};

const getDeleted = async () => {
  return User.find({ deleted_at: { $ne: null } })
    .populate("profile", "name")
    .sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return User.findOne({ _id: id, ...noBorrados })
    .populate("roleId", "name permissions isActive deleted_at")
    .populate("profile", "name");
};

const getAnyById = async (id) => {
  return User.findById(id);
};

const getRelationsById = async (id) => {
  return User.findOne({ _id: id, ...noBorrados }).select("roleId");
};

const getByEmail = async (email) => {
return User.findOne({ email, ...noBorrados });
};

const getByEmailForAuthentication = async (email) => {
  return User.findOne({ email, ...noBorrados })
    .select("+passwordHash")
    .populate("roleId", "name isActive deleted_at");
};

const updatePasswordHashIfCurrent = async (id, currentHash, passwordHash) => {
  return User.updateOne(
    { _id: id, passwordHash: currentHash, ...noBorrados },
    { $set: { passwordHash } }
  );
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

const restore = async (id) => {
  return User.findOneAndUpdate(
    { _id: id, deleted_at: { $ne: null } },
    { deleted_at: null, isActive: true },
    { new: true }
  ).populate("roleId", "name permissions");
};

const hardDelete = async (id) => {
  return User.findByIdAndDelete(id);
};

module.exports = { getAll, getDeleted, getById, getAnyById, getRelationsById, getByEmail, getByEmailForAuthentication, updatePasswordHashIfCurrent, emailExists, create, update, setActive, softDelete, restore, hardDelete };
