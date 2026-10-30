const rolesRepo = require("../repos/roles.repo");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { idParamSchema } = require("../validators/roles.validator");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function getRoles(query = {}) {
  const filtros = {};
  if (query.isActive !== undefined) filtros.isActive = query.isActive;
  return rolesRepo.getAll(filtros);
}

async function getRoleById(id) {
  const idValido = await validarId(id);
  const role = await rolesRepo.getById(idValido);
  if (!role) throw AppError.notFound("Rol no encontrado");
  return role;
}

module.exports = {
  getRoles,
  getRoleById
};
