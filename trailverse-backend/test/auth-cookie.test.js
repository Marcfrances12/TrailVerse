const assert = require("node:assert/strict");
const test = require("node:test");
const {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  opcionesAccess,
  opcionesRefresh,
  opcionesBorradoAccess,
  opcionesBorradoRefresh
} = require("../src/utils/auth-cookie");
const { tokenDeRequest } = require("../src/middlewares/auth.middleware");
const { signAccessToken, signRefreshToken } = require("../src/utils/jwt");

const ID = "507f1f77bcf86cd799439011";
const ACCESS = signAccessToken({ id: ID, role: "USER" });
const REFRESH = signRefreshToken({ id: ID, jti: "refresh-jti" });

test("la cookie de acceso es HttpOnly, SameSite=Lax y caduca con el access token", () => {
  const opciones = opcionesAccess(ACCESS);

  assert.equal(ACCESS_COOKIE, "access_token");
  assert.equal(opciones.httpOnly, true);
  assert.equal(opciones.sameSite, "lax");
  assert.equal(opciones.path, "/");
  assert.ok(opciones.maxAge > 0);
  assert.ok(opciones.maxAge <= 60 * 60 * 1000);
});

test("la cookie de refresh solo viaja a /api/auth y dura hasta 7 días", () => {
  const opciones = opcionesRefresh(REFRESH);

  assert.equal(REFRESH_COOKIE, "refresh_token");
  assert.equal(opciones.path, "/api/auth");
  assert.equal(opciones.httpOnly, true);
  assert.ok(opciones.maxAge > 6 * 24 * 60 * 60 * 1000);
  assert.ok(opciones.maxAge <= 7 * 24 * 60 * 60 * 1000);
});

test("los borrados usan la misma ruta y flags que la creación", () => {
  assert.equal(opcionesBorradoAccess().path, opcionesAccess(ACCESS).path);
  assert.equal(opcionesBorradoRefresh().path, opcionesRefresh(REFRESH).path);
  assert.equal(opcionesBorradoRefresh().httpOnly, opcionesRefresh(REFRESH).httpOnly);
});

test("tokenDeRequest prioriza la cabecera Bearer sobre la cookie", () => {
  const req = {
    get: (nombre) => (nombre === "authorization" ? "Bearer desde-cabecera" : undefined),
    cookies: { [ACCESS_COOKIE]: "desde-cookie" }
  };
  assert.equal(tokenDeRequest(req), "desde-cabecera");
});

test("tokenDeRequest usa la cookie de acceso cuando no hay cabecera", () => {
  const req = { get: () => undefined, cookies: { [ACCESS_COOKIE]: "desde-cookie" } };
  assert.equal(tokenDeRequest(req), "desde-cookie");
});

test("tokenDeRequest devuelve null sin cabecera ni cookie", () => {
  assert.equal(tokenDeRequest({ get: () => undefined }), null);
});
