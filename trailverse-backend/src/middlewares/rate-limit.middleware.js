const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const AppError = require("../utils/AppError");

const respuestaLimitada = (mensaje) => (req, res, next) => next(new AppError(mensaje, 429));

const LOGIN_MAX_INTENTOS =
  Number(process.env.LOGIN_MAX_INTENTOS) || (process.env.NODE_ENV === "production" ? 10 : 50);

// Cuenta por IP y por identificador: un usuario que se equivoca no bloquea a los demás.
function claveDeLogin(req) {
  const identificador = String(req.body?.identificador ?? "").trim().toLowerCase().slice(0, 254);
  return `${ipKeyGenerator(req.ip)}|${identificador}`;
}

// Solo cuentan los intentos fallidos: un login correcto no consume el límite.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: LOGIN_MAX_INTENTOS,
  keyGenerator: claveDeLogin,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: respuestaLimitada("Demasiados intentos de inicio de sesión. Inténtalo de nuevo en unos minutos")
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: respuestaLimitada("Demasiados registros desde esta conexión. Inténtalo más tarde")
});

module.exports = { loginLimiter, registerLimiter, claveDeLogin, LOGIN_MAX_INTENTOS };
