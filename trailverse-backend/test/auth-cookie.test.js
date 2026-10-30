const assert = require("node:assert/strict");
const test = require("node:test");
const { AUTH_COOKIE, opcionesSesion, opcionesBorrado } = require("../src/utils/auth-cookie");
const { tokenDeRequest } = require("../src/middlewares/auth.middleware");
const { signAccessToken } = require("../src/utils/jwt");

const TOKEN = signAccessToken({ id: "507f1f77bcf86cd799439011", role: "USER" });

test("la cookie de sesión es HttpOnly, SameSite=Lax y caduca con el token", () => {
  const opciones = opcionesSesion(TOKEN);

  assert.equal(AUTH_COOKIE, "trailverse_session");
  assert.equal(opciones.httpOnly, true);
  assert.equal(opciones.sameSite, "lax");
  assert.equal(opciones.path, "/");
  assert.ok(opciones.maxAge > 0);
  assert.ok(opciones.maxAge <= 60 * 60 * 1000);
});

test("el borrado de cookie usa la misma ruta y flags que la creación", () => {
  const borrado = opcionesBorrado();
  const creado = opcionesSesion(TOKEN);

  assert.equal(borrado.path, creado.path);
  assert.equal(borrado.httpOnly, creado.httpOnly);
  assert.equal(borrado.sameSite, creado.sameSite);
});

test("tokenDeRequest prioriza la cabecera Bearer sobre la cookie", () => {
  const req = {
    get: (nombre) => (nombre === "authorization" ? "Bearer desde-cabecera" : undefined),
    cookies: { [AUTH_COOKIE]: "desde-cookie" }
  };
  assert.equal(tokenDeRequest(req), "desde-cabecera");
});

test("tokenDeRequest usa la cookie cuando no hay cabecera", () => {
  const req = { get: () => undefined, cookies: { [AUTH_COOKIE]: "desde-cookie" } };
  assert.equal(tokenDeRequest(req), "desde-cookie");
});

test("tokenDeRequest devuelve null sin cabecera ni cookie", () => {
  assert.equal(tokenDeRequest({ get: () => undefined }), null);
});
