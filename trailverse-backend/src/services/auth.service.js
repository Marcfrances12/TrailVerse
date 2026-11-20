const crypto = require("crypto");
const usersRepo = require("../repos/users.repo");
const rolesRepo = require("../repos/roles.repo");
const revokedTokensRepo = require("../repos/revoked-tokens.repo");
const refreshSessionsRepo = require("../repos/refresh-sessions.repo");
const profilesRepo = require("../repos/profiles.repo");
const Role = require("../models/role.model");
const password = require("../utils/password");
const jwt = require("../utils/jwt");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { loginSchema, registerSchema } = require("../validators/auth.validator");

const ROLES_VALIDOS = () => Role.schema.path("name").enumValues;

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

function sesionNoValida(mensaje, codigo) {
  const error = AppError.unauthorized(mensaje);
  error.codigo = codigo;
  return error;
}

// Devuelve el nombre del rol si la cuenta puede iniciar sesión o renovar su sesión.
function rolDeUsuarioActivo(user) {
  const role = user?.roleId;
  if (
    !user ||
    !user.isActive ||
    !role ||
    typeof role !== "object" ||
    !role.isActive ||
    role.deleted_at ||
    !ROLES_VALIDOS().includes(role.name)
  ) return null;
  return role.name;
}

// Emite un access token y un refresh token nuevo. El refresh queda registrado en BD para poder rotarlo y revocarlo.
async function emitirSesion(user, role) {
  const jti = crypto.randomUUID();
  const refreshToken = jwt.signRefreshToken({ id: user._id, jti });
  await refreshSessionsRepo.create({
    jti,
    userId: user._id,
    expiresAt: jwt.expirationDate(refreshToken)
  });

  return {
    accessToken: jwt.signAccessToken({ id: user._id, role }),
    refreshToken
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

  const roleName = rolDeUsuarioActivo(user);
  if (!roleName) return null;

  const currentHash = user.passwordHash;
  if (!(await verifyPassword(rawPassword, currentHash))) return null;

  if (password.needsRehash(currentHash)) {
    const upgradedHash = await password.hashPassword(rawPassword);
    await usersRepo.updatePasswordHashIfCurrent(user._id, currentHash, upgradedHash);
  }

  return { user, role: roleName };
}

async function login(datos) {
  const datosValidos = validarConZod(loginSchema, datos, "body");
  const credentials = await verifyCredentials(datosValidos.identificador, datosValidos.password);
  if (!credentials) throw AppError.unauthorized("Invalid credentials");

  const perfil = await profilesRepo.getByUserId(credentials.user._id);
  const sesion = await emitirSesion(credentials.user, credentials.role);
  return {
    user: userResponse(credentials.user, credentials.role, perfil?.name ?? null),
    ...sesion
  };
}

async function register(datos) {
  const { name, email, password: rawPassword } = validarConZod(registerSchema, datos, "body");

  if (await usersRepo.emailExists(email)) {
    throw AppError.conflict("Ya existe un usuario con ese email");
  }

  const rol = await rolesRepo.getByName("USER");
  if (!rol || !rol.isActive) {
    throw new AppError("El rol de cliente no está disponible", 500);
  }

  const passwordHash = await password.hashPassword(rawPassword);
  const user = await usersRepo.create({ email, passwordHash, roleId: rol._id });

  try {
    await profilesRepo.createForUser(user._id, name);
  } catch (error) {
    await profilesRepo.deleteForUser(user._id).catch(() => {});
    await user.deleteOne().catch(() => {});
    throw error;
  }

  return userResponse(user, rol.name, name);
}

// Rota el refresh token: el anterior queda revocado y se emite un par nuevo.
async function refresh(refreshToken) {
  if (!refreshToken) throw sesionNoValida("Authentication required", "SESSION_REQUIRED");

  let payload;
  try {
    payload = jwt.verifyRefreshToken(refreshToken);
  } catch {
    throw sesionNoValida("La sesión ha expirado. Inicia sesión de nuevo", "SESSION_EXPIRED");
  }

  const revocada = await refreshSessionsRepo.revokeIfActive(payload.jti);
  if (!revocada || String(revocada.userId) !== payload.sub) {
    throw sesionNoValida("La sesión ha expirado. Inicia sesión de nuevo", "SESSION_EXPIRED");
  }

  const user = await usersRepo.getById(payload.sub);
  const roleName = rolDeUsuarioActivo(user);
  if (!user || !roleName) {
    throw sesionNoValida("La sesión ha expirado. Inicia sesión de nuevo", "SESSION_EXPIRED");
  }

  const sesion = await emitirSesion(user, roleName);
  return { user: userResponse(user, roleName, user.profile?.name ?? null), ...sesion };
}

async function logout(userId, accessToken, refreshToken) {
  if (!accessToken?.jti || !(accessToken.expiresAt instanceof Date) || Number.isNaN(accessToken.expiresAt.getTime())) {
    throw AppError.unauthorized("Authentication required");
  }

  await revokedTokensRepo.revoke({
    jti: accessToken.jti,
    userId,
    expiresAt: accessToken.expiresAt
  });

  if (!refreshToken) return;
  try {
    const payload = jwt.verifyRefreshToken(refreshToken);
    if (payload.sub === String(userId)) await refreshSessionsRepo.revoke(payload.jti);
  } catch {
    // Un refresh inválido o caducado ya no tiene sesión que revocar.
  }
}

module.exports = { login, register, refresh, logout };
