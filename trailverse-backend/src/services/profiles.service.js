const profilesRepo = require("../repos/profiles.repo");
const usersRepo = require("../repos/users.repo");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { userIdParamSchema, updateProfileSchema } = require("../validators/profiles.validator");
const { canAccessUserResource } = require("../utils/authorization");

async function getProfiles() {
  const activeUsers = await usersRepo.getAll({ isActive: true });
  return profilesRepo.getAll(activeUsers.map((user) => user._id));
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
