const hostsRepo = require("../repos/hosts.repo");
const AppError = require("../utils/AppError");
const { generateSlug } = require("../utils/slug");
const { validarConZod } = require("../utils/validar");
const { idParamSchema } = require("../validators/rutas.validator");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function construirSlugUnico(name) {
  const base = generateSlug(name);
  let candidato = base;
  let contador = 2;
  while (await hostsRepo.slugExists(candidato)) {
    candidato = `${base}-${contador}`;
    contador += 1;
  }
  return candidato;
}

async function getHosts(query = {}) {
  const filtros = {};
  if (query.isActive !== undefined) filtros.isActive = query.isActive;
  return hostsRepo.getAll(filtros);
}

async function getHostsEliminados() {
  return hostsRepo.getDeleted();
}

async function getHostById(id) {
  const idValido = await validarId(id);
  const host = await hostsRepo.getById(idValido);
  if (!host) throw AppError.notFound("Host no encontrado");
  return host;
}

async function getHostBySlug(slug) {
  const host = await hostsRepo.getBySlug(slug);
  if (!host) throw AppError.notFound("Host no encontrado");
  return host;
}

async function createHost(datos) {
  const slug = await construirSlugUnico(datos.name);
  return hostsRepo.create({ ...datos, slug });
}

async function updateHost(id, datos) {
  const idValido = await validarId(id);
  if (datos.name) {
    datos.slug = await construirSlugUnico(datos.name);
  }
  const host = await hostsRepo.update(idValido, datos);
  if (!host) throw AppError.notFound("Host no encontrado");
  return host;
}

async function activateHost(id) {
  const idValido = await validarId(id);
  const host = await hostsRepo.setActive(idValido, true);
  if (!host) throw AppError.notFound("Host no encontrado");
  return host;
}

async function deactivateHost(id) {
  const idValido = await validarId(id);
  const host = await hostsRepo.setActive(idValido, false);
  if (!host) throw AppError.notFound("Host no encontrado");
  return host;
}

async function deleteHost(id) {
  const idValido = await validarId(id);
  const host = await hostsRepo.softDelete(idValido);
  if (!host) throw AppError.notFound("Host no encontrado");
  return host;
}

async function restoreHost(id) {
  const idValido = await validarId(id);
  const host = await hostsRepo.restore(idValido);
  if (!host) throw AppError.notFound("Host no encontrado en la papelera");
  return host;
}

async function hardDeleteHost(id) {
  const idValido = await validarId(id);
  const host = await hostsRepo.hardDelete(idValido);
  if (!host) throw AppError.notFound("Host no encontrado");
  return host;
}

module.exports = {
  getHosts,
  getHostsEliminados,
  getHostById,
  getHostBySlug,
  createHost,
  updateHost,
  activateHost,
  deactivateHost,
  deleteHost,
  restoreHost,
  hardDeleteHost
};
