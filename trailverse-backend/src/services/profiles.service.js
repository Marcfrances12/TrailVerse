const profilesRepo = require("../repos/profiles.repo");
const usersRepo = require("../repos/users.repo");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { userIdParamSchema, updateProfileSchema } = require("../validators/profiles.validator");
const { canAccessUserResource } = require("../utils/authorization");

const ESTADOS_INCIDENCIA = ["usuario-no-existe", "sin-perfil"];

function estadoDe(usuario) {
  if (!usuario) return "usuario-no-existe";
  if (!usuario.isActive) return "usuario-inactivo";
  return "ok";
}

function filaDePerfil(perfil, usuario) {
  return {
    _id: String(perfil._id),
    userId: String(perfil.userId),
    email: usuario?.email ?? null,
    usuarioActivo: usuario ? usuario.isActive : null,
    name: perfil.name,
    avatarUrl: perfil.avatarUrl,
    bio: perfil.bio,
    phone: perfil.phone,
    estado: estadoDe(usuario),
    created_at: perfil.created_at,
    updated_at: perfil.updated_at
  };
}

function filaSinPerfil(usuario) {
  return {
    _id: null,
    userId: String(usuario._id),
    email: usuario.email,
    usuarioActivo: usuario.isActive,
    name: null,
    avatarUrl: "",
    bio: "",
    phone: "",
    estado: "sin-perfil",
    created_at: null,
    updated_at: null
  };
}

async function getProfiles(filtros = {}) {
  const [perfiles, usuarios] = await Promise.all([
    profilesRepo.getAllRaw(),
    usersRepo.getAllWithState()
  ]);

  const usuariosPorId = new Map(usuarios.map((usuario) => [String(usuario._id), usuario]));
  const usuariosConPerfil = new Set(perfiles.map((perfil) => String(perfil.userId)));

  const filas = perfiles
    .filter((perfil) => !usuariosPorId.get(String(perfil.userId))?.deleted_at)
    .map((perfil) => filaDePerfil(perfil, usuariosPorId.get(String(perfil.userId))));

  const sinPerfil = usuarios
    .filter((usuario) => !usuario.deleted_at && !usuariosConPerfil.has(String(usuario._id)))
    .map(filaSinPerfil);

  const todas = [...filas, ...sinPerfil];
  return filtros.soloIncidencias
    ? todas.filter((fila) => ESTADOS_INCIDENCIA.includes(fila.estado))
    : todas;
}

async function getProfileForUser(actor, userId) {
  const validUserId = validarConZod(userIdParamSchema, { userId }, "params").userId;
  const user = await usersRepo.getById(validUserId);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  if (!canAccessUserResource(actor, user)) throw AppError.forbidden();

  const profile = await profilesRepo.getByUserId(user._id);
  if (!profile) throw AppError.notFound("Perfil no encontrado");
  return profile;
}

async function updateProfileForUser(actor, userId, data) {
  const validUserId = validarConZod(userIdParamSchema, { userId }, "params").userId;
  const validData = validarConZod(updateProfileSchema, data, "body");
  const user = await usersRepo.getById(validUserId);
  if (!user) throw AppError.notFound("Usuario no encontrado");
  if (!canAccessUserResource(actor, user)) throw AppError.forbidden();

  const profile = await profilesRepo.updateByUserId(user._id, validData);
  if (!profile) throw AppError.notFound("Perfil no encontrado");
  return profile;
}

module.exports = { getProfiles, getProfileForUser, updateProfileForUser };
