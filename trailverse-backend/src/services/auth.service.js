const usersRepo = require("../repos/users.repo");
const revokedTokensRepo = require("../repos/revoked-tokens.repo");
const profilesRepo = require("../repos/profiles.repo");
const Role = require("../models/role.model");
const password = require("../utils/password");
const jwt = require("../utils/jwt");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { loginSchema } = require("../validators/auth.validator");

async function verifyPassword(rawPassword, passwordHash) {
  return password.verifyPassword(rawPassword, passwordHash);
}

function userResponse(user, role, name) {
  return {
    _id: String(user._id),
    name,
    email: user.email,
    role
  };
}

function authResponse(user, role, name) {
  return {
    user: userResponse(user, role, name),
    token: jwt.signAccessToken({ id: user._id, role })
  };
}

// Primero busca por email y después por usuario. Ambos son únicos.
async function buscarPorIdentificador(identificador) {
  const normalizado = identificador.trim().toLowerCase();
  const porEmail = await usersRepo.getByEmailForAuthentication(normalizado);
  if (porEmail) return porEmail;
  return usersRepo.getByUsernameForAuthentication(normalizado);
}

async function verifyCredentials(identificador, rawPassword) {
  const user = typeof identificador === "string" ? await buscarPorIdentificador(identificador) : null;
  if (!user || !user.isActive) return null;

  const role = user.roleId;
  const validRoles = Role.schema.path("name").enumValues;
  if (
    !role ||
    typeof role !== "object" ||
    !role.isActive ||
    role.deleted_at ||
    !validRoles.includes(role.name)
  ) return null;

  const currentHash = user.passwordHash;
  if (!(await verifyPassword(rawPassword, currentHash))) return null;

  if (password.needsRehash(currentHash)) {
    const upgradedHash = await password.hashPassword(rawPassword);
    await usersRepo.updatePasswordHashIfCurrent(user._id, currentHash, upgradedHash);
  }

  return { user, role: role.name };
}

async function login(datos) {
  const datosValidos = validarConZod(loginSchema, datos, "body");
  const credentials = await verifyCredentials(datosValidos.identificador, datosValidos.password);
  if (!credentials) throw AppError.unauthorized("Invalid credentials");

  const perfil = await profilesRepo.getByUserId(credentials.user._id);
  return authResponse(credentials.user, credentials.role, perfil?.name ?? null);
}

async function logout(userId, token) {
  if (!token?.jti || !(token.expiresAt instanceof Date) || Number.isNaN(token.expiresAt.getTime())) {
    throw AppError.unauthorized("Authentication required");
  }

  await revokedTokensRepo.revoke({
    jti: token.jti,
    userId,
    expiresAt: token.expiresAt
  });
}

module.exports = { login, logout };
