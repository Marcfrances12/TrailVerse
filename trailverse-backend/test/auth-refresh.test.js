const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
process.env.JWT_SECRET ||= crypto.randomBytes(32).toString("hex");
process.env.JWT_REFRESH_SECRET ||= crypto.randomBytes(32).toString("hex");
const authService = require("../src/services/auth.service");
const usersRepo = require("../src/repos/users.repo");
const rolesRepo = require("../src/repos/roles.repo");
const profilesRepo = require("../src/repos/profiles.repo");
const refreshSessionsRepo = require("../src/repos/refresh-sessions.repo");
const jwt = require("../src/utils/jwt");

const USER_ID = "507f1f77bcf86cd799439011";
const ROL_USER = { _id: "65a000000000000000000002", name: "USER", isActive: true, deleted_at: null };
const usuarioActivo = () => ({
  _id: USER_ID,
  email: "cliente@example.com",
  isActive: true,
  roleId: { name: "USER", isActive: true, deleted_at: null },
  profile: { name: "Cliente" }
});

function conStubs(stubs, fn) {
  const restaurar = stubs.map(([objeto, metodo, valor]) => {
    const original = objeto[metodo];
    objeto[metodo] = valor;
    return () => { objeto[metodo] = original; };
  });
  return Promise.resolve().then(fn).finally(() => restaurar.forEach((deshacer) => deshacer()));
}

async function errorDe(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  assert.fail("Se esperaba un error");
}

test("access y refresh no se pueden usar uno en lugar del otro", () => {
  const refresh = jwt.signRefreshToken({ id: USER_ID, jti: "j1" });
  const access = jwt.signAccessToken({ id: USER_ID, role: "USER" });

  assert.throws(() => jwt.verifyAccessToken(refresh));
  assert.throws(() => jwt.verifyRefreshToken(access));
  assert.equal(jwt.verifyRefreshToken(refresh).jti, "j1");
});

test("refresh válido rota la sesión y emite un par nuevo", async () => {
  const sesionAnterior = { jti: "j-anterior", userId: USER_ID };
  const anterior = jwt.signRefreshToken({ id: USER_ID, jti: "j-anterior" });
  let creada;

  const resultado = await conStubs([
    [refreshSessionsRepo, "revokeIfActive", async (jti) => (jti === "j-anterior" ? sesionAnterior : null)],
    [refreshSessionsRepo, "create", async (datos) => { creada = datos; }],
    [usersRepo, "getById", async () => usuarioActivo()]
  ], () => authService.refresh(anterior));

  assert.equal(resultado.user.role, "USER");
  assert.equal(jwt.verifyAccessToken(resultado.accessToken).sub, USER_ID);
  assert.notEqual(jwt.verifyRefreshToken(resultado.refreshToken).jti, "j-anterior");
  assert.equal(creada.userId, USER_ID);
});

test("un refresh ya usado o revocado se rechaza con SESSION_EXPIRED", async () => {
  const token = jwt.signRefreshToken({ id: USER_ID, jti: "usado" });

  const error = await conStubs([
    [refreshSessionsRepo, "revokeIfActive", async () => null]
  ], () => errorDe(authService.refresh(token)));

  assert.equal(error.statusCode, 401);
  assert.equal(error.codigo, "SESSION_EXPIRED");
});

test("sin refresh token se responde SESSION_REQUIRED", async () => {
  const error = await errorDe(authService.refresh(undefined));
  assert.equal(error.statusCode, 401);
  assert.equal(error.codigo, "SESSION_REQUIRED");
});

test("un access token enviado como refresh se rechaza", async () => {
  const access = jwt.signAccessToken({ id: USER_ID, role: "USER" });
  const error = await errorDe(authService.refresh(access));
  assert.equal(error.codigo, "SESSION_EXPIRED");
});

test("un usuario desactivado no puede renovar la sesión", async () => {
  const token = jwt.signRefreshToken({ id: USER_ID, jti: "desactivado" });
  const inactivo = { ...usuarioActivo(), isActive: false };

  const error = await conStubs([
    [refreshSessionsRepo, "revokeIfActive", async () => ({ userId: USER_ID })],
    [usersRepo, "getById", async () => inactivo]
  ], () => errorDe(authService.refresh(token)));

  assert.equal(error.codigo, "SESSION_EXPIRED");
});

test("el registro asigna el rol USER desde BD y crea perfil", async () => {
  let usuarioCreado;
  let perfilCreado;

  const resultado = await conStubs([
    [usersRepo, "emailExists", async () => false],
    [rolesRepo, "getByName", async (nombre) => (nombre === "USER" ? ROL_USER : null)],
    [usersRepo, "create", async (datos) => { usuarioCreado = datos; return { _id: USER_ID, email: datos.email }; }],
    [profilesRepo, "createForUser", async (id, name) => { perfilCreado = { id, name }; }]
  ], () => authService.register({
    name: "  Ana  ",
    email: "ANA@Example.com",
    password: "clave-segura-123"
  }));

  assert.equal(usuarioCreado.roleId, ROL_USER._id);
  assert.equal(usuarioCreado.email, "ana@example.com");
  assert.notEqual(usuarioCreado.passwordHash, "clave-segura-123");
  assert.equal(perfilCreado.name, "Ana");
  assert.equal(resultado.role, "USER");
  assert.equal(Object.hasOwn(resultado, "passwordHash"), false);
});

test("el registro rechaza un roleId enviado por el cliente", async () => {
  const error = await errorDe(authService.register({
    name: "Ana",
    email: "ana@example.com",
    password: "clave-segura-123",
    roleId: "65a000000000000000000001"
  }));
  assert.equal(error.statusCode, 400);
});

test("el registro devuelve 409 si el email ya existe", async () => {
  const error = await conStubs([
    [usersRepo, "emailExists", async () => true]
  ], () => errorDe(authService.register({
    name: "Ana",
    email: "ana@example.com",
    password: "clave-segura-123"
  })));
  assert.equal(error.statusCode, 409);
});
