const rolesRepo = require("../repos/roles.repo");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { idParamSchema } = require("../validators/rutas.validator");

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
  const existe = await rolesRepo.nameExists(datos.name);
  if (existe) throw AppError.conflict("Ya existe un rol con ese nombre");
  return rolesRepo.create(datos);
}

async function updateRole(id, datos) {
  const idValido = await validarId(id);
  if (datos.name) {
    const existe = await rolesRepo.nameExists(datos.name, idValido);
    if (existe) throw AppError.conflict("Ya existe un rol con ese nombre");
  }
  const role = await rolesRepo.update(idValido, datos);
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
  const role = await rolesRepo.setActive(idValido, false);
  if (!role) throw AppError.notFound("Rol no encontrado");
  return role;
}

async function deleteRole(id) {
  const idValido = await validarId(id);
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
