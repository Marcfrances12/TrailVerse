const usersRepo = require("../repos/users.repo");
const profilesRepo = require("../repos/profiles.repo");
const AppError = require("../utils/AppError");
const password = require("../utils/password");
const { validarConZod } = require("../utils/validar");
const { idParamSchema, createUserSchema, updateUserSchema } = require("../validators/users.validator");
const integrity = require("./integrity.service");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

function presentar(user, nombre) {
  const obj = user.toObject();
  delete obj.passwordHash;
  return { ...obj, name: nombre ?? null };
}

async function presentarConNombre(user) {
  const perfil = user.profile ?? (await profilesRepo.getByUserId(user._id));
  return presentar(user, perfil?.name);
}

async function getUsers(query = {}) {
  const filtros = {};
  if (query.isActive !== undefined) filtros.isActive = query.isActive;
  const usuarios = await usersRepo.getAll(filtros);
  return usuarios.map((user) => presentar(user, user.profile?.name));
}

async function getUsersEliminados() {
  const usuarios = await usersRepo.getDeleted();
  return usuarios.map((user) => presentar(user, user.profile?.name));
}

async function getUserById(id) {
  const idValido = await validarId(id);
  const user = await usersRepo.getById(idValido);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  return presentarConNombre(user);
}

async function createUser(datos) {
  const { name, password: rawPassword, ...userData } = validarConZod(createUserSchema, datos, "body");
  await integrity.validarRelacionesUsuario(userData); //aqui valida rol

  if (await usersRepo.emailExists(userData.email)) {
    throw AppError.conflict("Ya existe un usuario con ese email");
  }

  const passwordHash = await password.hashPassword(rawPassword);
  const user = await usersRepo.create({ ...userData, passwordHash });

  try {
    await profilesRepo.createForUser(user._id, name);
  } catch (error) {
    await profilesRepo.deleteForUser(user._id).catch(() => {});
    await user.deleteOne().catch(() => {});
    throw error;
  }

  return presentar(user, name);
}

async function updateUser(id, datos) {
  const idValido = await validarId(id);
  const { name, ...datosUsuario } = validarConZod(updateUserSchema, datos, "body");
  const actual = await usersRepo.getById(idValido);
  
  if (!actual) throw AppError.notFound("Usuario no encontrado");
  await integrity.validarRelacionesUsuario(datosUsuario);
  if (datosUsuario.email) {
    const existe = await usersRepo.emailExists(datosUsuario.email, idValido);
    if (existe) throw AppError.conflict("Ya existe un usuario con ese email");
  }

  if (name !== undefined) {
    const perfil = await profilesRepo.updateByUserId(idValido, { name });
    if (!perfil) throw AppError.notFound("Perfil no encontrado");
  }

  if (Object.keys(datosUsuario).length > 0) {
    const user = await usersRepo.update(idValido, datosUsuario);
    if (!user) throw AppError.notFound("Usuario no encontrado");
  }

  return presentarConNombre(await usersRepo.getById(idValido));
}

async function activateUser(id) {
  const idValido = await validarId(id);
  const actual = await usersRepo.getRelationsById(idValido);
  if (!actual) throw AppError.notFound("Usuario no encontrado");
  await integrity.validarRelacionesUsuario({ roleId: actual.roleId });
  const user = await usersRepo.setActive(idValido, true);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  return presentarConNombre(user);
}

async function deactivateUser(id) {
  const idValido = await validarId(id);
  await integrity.comprobarSinReferencias("user", idValido, "desactivar");
  const user = await usersRepo.setActive(idValido, false);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  return presentarConNombre(user);
}

async function deleteUser(id) {
  const idValido = await validarId(id);
  await integrity.comprobarSinReferencias("user", idValido, "eliminar lógicamente");
  const user = await usersRepo.softDelete(idValido);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  return user;
}

async function restoreUser(id) {
  const idValido = await validarId(id);
  const actual = await usersRepo.getAnyById(idValido);
  if (!actual || actual.deleted_at == null) throw AppError.notFound("Usuario no encontrado en la papelera");
  await integrity.validarRelacionesUsuario({ roleId: actual.roleId });
  const user = await usersRepo.restore(idValido);
  if (!user) throw AppError.notFound("Usuario no encontrado en la papelera");
  return presentarConNombre(user);
}

async function hardDeleteUser(id) {
  const idValido = await validarId(id);
  await integrity.comprobarBorradoDefinitivo("user", idValido);
  await profilesRepo.deleteForUser(idValido);
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
