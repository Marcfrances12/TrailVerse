require("dotenv").config();

const crypto = require("crypto");
const jsonwebtoken = require("jsonwebtoken");
const Role = require("../models/role.model");

const secret = process.env.JWT_SECRET;
if (typeof secret !== "string" || Buffer.byteLength(secret) < 32) {
  throw new Error("JWT_SECRET debe estar configurado y tener al menos 32 bytes");
}

const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (typeof refreshSecret !== "string" || Buffer.byteLength(refreshSecret) < 32) {
  throw new Error("JWT_REFRESH_SECRET debe estar configurado y tener al menos 32 bytes");
}
if (refreshSecret === secret) {
  throw new Error("JWT_REFRESH_SECRET debe ser distinto de JWT_SECRET");
}

const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const formatoDuracion = /^[1-9]\d*(s|m|h|d|w|y)$/;
if (!formatoDuracion.test(expiresIn)) {
  throw new Error("JWT_EXPIRES_IN debe usar un formato como 15m, 1h o 7d");
}
if (!formatoDuracion.test(refreshExpiresIn)) {
  throw new Error("JWT_REFRESH_EXPIRES_IN debe usar un formato como 15m, 1h o 7d");
}

const issuer = process.env.JWT_ISSUER || "trailverse-api";
const audience = process.env.JWT_AUDIENCE || "trailverse-client";
const roleNames = Role.schema.path("name").enumValues;

function signAccessToken({ id, role }) {
  if (!id || !roleNames.includes(role)) {
    throw new TypeError("El token requiere un usuario y un rol válido");
  }

  return jsonwebtoken.sign(
    { role, typ: "access" },
    secret,
    {
      algorithm: "HS256",
      subject: String(id),
      jwtid: crypto.randomUUID(),
      expiresIn,
      issuer,
      audience
    }
  );
}

function signRefreshToken({ id, jti }) {
  if (!id || !jti) {
    throw new TypeError("El refresh token requiere un usuario y un identificador");
  }

  return jsonwebtoken.sign(
    { typ: "refresh" },
    refreshSecret,
    {
      algorithm: "HS256",
      subject: String(id),
      jwtid: jti,
      expiresIn: refreshExpiresIn,
      issuer,
      audience
    }
  );
}

function verifyAccessToken(token) {
  const payload = jsonwebtoken.verify(token, secret, {
    algorithms: ["HS256"],
    issuer,
    audience
  });
  if (payload.typ !== "access") throw new jsonwebtoken.JsonWebTokenError("Tipo de token no válido");
  return payload;
}

function verifyRefreshToken(token) {
  const payload = jsonwebtoken.verify(token, refreshSecret, {
    algorithms: ["HS256"],
    issuer,
    audience
  });
  if (payload.typ !== "refresh") throw new jsonwebtoken.JsonWebTokenError("Tipo de token no válido");
  return payload;
}

function expirationDate(token) {
  return new Date(jsonwebtoken.decode(token).exp * 1000);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, expirationDate };
