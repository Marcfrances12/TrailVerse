const assert = require("node:assert/strict");
const test = require("node:test");
const { claveDeLogin, LOGIN_MAX_INTENTOS } = require("../src/middlewares/rate-limit.middleware");

test("la clave de login normaliza el identificador y separa usuarios distintos", () => {
  const ip = "::1";
  const a = claveDeLogin({ ip, body: { identificador: "  Marc@Example.com " } });
  const b = claveDeLogin({ ip, body: { identificador: "marc@example.com" } });
  const otro = claveDeLogin({ ip, body: { identificador: "ana@example.com" } });

  assert.equal(a, b);
  assert.notEqual(a, otro);
});

test("el límite de login es un número positivo", () => {
  assert.ok(Number.isInteger(LOGIN_MAX_INTENTOS) && LOGIN_MAX_INTENTOS > 0);
});
