const rolesRepo = require("../repos/roles.repo");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { idParamSchema, createRoleSchema, updateRoleSchema } = require("../validators/roles.validator");
const integrity = require("./integrity.service");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function getRoles(query = {}) {
  const filtros = {};
  if (query.isActive !== undefined) filtros.isActive = query.isActive;
  return rolesRepo.getAll(filtros);
}

async function getRolesEliminados() {
  return rolesRepo.getDeleted();
}

async function getRoleById(id) {
  const idValido = await validarId(id);
  const role = await rolesRepo.getById(idValido);
  if (!role) throw AppError.notFound("Rol no encontrado");
  return role;
}

async function createRole(datos) {
  const datosValidos = validarConZod(createRoleSchema, datos, "body");
  const existe = await rolesRepo.nameExists(datosValidos.name);
  if (existe) throw AppError.conflict("Ya existe un rol con ese nombre");
  return rolesRepo.create(datosValidos);
}

async function updateRole(id, datos) {
  const idValido = await validarId(id);
  const datosValidos = validarConZod(updateRoleSchema, datos, "body");
  if (datosValidos.name) {
    const existe = await rolesRepo.nameExists(datosValidos.name, idValido);
    if (existe) throw AppError.conflict("Ya existe un rol con ese nombre");
  }
  const role = await rolesRepo.update(idValido, datosValidos);
  if (!role) throw AppError.notFound("Rol no encontrado");
  return role;
}

async function activateRole(id) {
  const idValido = await validarId(id);
  const role = await rolesRepo.setActive(idValido, true);
  if (!role) throw AppError.notFound("Rol no encontrado");
  return role;
}

async function deactivateRole(id) {
  const idValido = await validarId(id);
  await integrity.comprobarSinReferencias("role", idValido, "desactivar");
  const role = await rolesRepo.setActive(idValido, false);
  if (!role) throw AppError.notFound("Rol no encontrado");
  return role;
}

async function deleteRole(id) {
  const idValido = await validarId(id);
  await integrity.comprobarSinReferencias("role", idValido, "eliminar lógicamente");
  const role = await rolesRepo.softDelete(idValido);
  if (!role) throw AppError.notFound("Rol no encontrado");
  return role;
}

async function restoreRole(id) {
  const idValido = await validarId(id);
  const role = await rolesRepo.restore(idValido);
  if (!role) throw AppError.notFound("Rol no encontrado en la papelera");
  return role;
}

async function hardDeleteRole(id) {
  const idValido = await validarId(id);
  await integrity.comprobarBorradoDefinitivo("role", idValido);
  const role = await rolesRepo.hardDelete(idValido);
  if (!role) throw AppError.notFound("Rol no encontrado");
  return role;
}

module.exports = {
  getRoles,
  getRolesEliminados,
  getRoleById,
  createRole,
  updateRole,
  activateRole,
  deactivateRole,
  deleteRole,
  restoreRole,
  hardDeleteRole
};
