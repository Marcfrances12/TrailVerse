const crypto = require("crypto");
const usersRepo = require("../repos/users.repo");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { idParamSchema } = require("../validators/rutas.validator");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function getUsers(query = {}) {
  const filtros = {};
  if (query.isActive !== undefined) filtros.isActive = query.isActive;
  return usersRepo.getAll(filtros);
}

async function getUsersEliminados() {
  return usersRepo.getDeleted();
}

async function getUserById(id) {
  const idValido = await validarId(id);
  const user = await usersRepo.getById(idValido);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.passwordHash;
  return userObj;
}

async function createUser(datos) {
  const existe = await usersRepo.emailExists(datos.email);
  if (existe) throw AppError.conflict("Ya existe un usuario con ese email");
  const passwordHash = hashPassword(datos.password);
  const { password, ...resto } = datos;
  const user = await usersRepo.create({ ...resto, passwordHash });
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.passwordHash;
  return userObj;
}

async function updateUser(id, datos) {
  const idValido = await validarId(id);
  if (datos.email) {
    const existe = await usersRepo.emailExists(datos.email, idValido);
    if (existe) throw AppError.conflict("Ya existe un usuario con ese email");
  }
  const { password, ...resto } = datos;
  const updateData = { ...resto };
  if (password) {
    updateData.passwordHash = hashPassword(password);
  }
  const user = await usersRepo.update(idValido, updateData);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.passwordHash;
  return userObj;
}

async function activateUser(id) {
  const idValido = await validarId(id);
  const user = await usersRepo.setActive(idValido, true);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.passwordHash;
  return userObj;
}

async function deactivateUser(id) {
  const idValido = await validarId(id);
  const user = await usersRepo.setActive(idValido, false);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.passwordHash;
  return userObj;
}

async function deleteUser(id) {
  const idValido = await validarId(id);
  const user = await usersRepo.softDelete(idValido);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  return user;
}

async function restoreUser(id) {
  const idValido = await validarId(id);
  const user = await usersRepo.restore(idValido);
  if (!user) throw AppError.notFound("Usuario no encontrado en la papelera");
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.passwordHash;
  return userObj;
}

async function hardDeleteUser(id) {
  const idValido = await validarId(id);
  const user = await usersRepo.hardDelete(idValido);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  return user;
}

module.exports = {
  getUsers,
  getUsersEliminados,
  getUserById,
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
  restoreUser,
  hardDeleteUser
};
