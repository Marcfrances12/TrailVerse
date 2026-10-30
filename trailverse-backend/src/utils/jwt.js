require("dotenv").config();

const crypto = require("crypto");
const jsonwebtoken = require("jsonwebtoken");
const Role = require("../models/role.model");

const secret = process.env.JWT_SECRET;
if (typeof secret !== "string" || Buffer.byteLength(secret) < 32) {
  throw new Error("JWT_SECRET debe estar configurado y tener al menos 32 bytes");
}

const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
if (!/^[1-9]\d*(s|m|h|d|w|y)$/.test(expiresIn)) {
  throw new Error("JWT_EXPIRES_IN debe usar un formato como 15m, 1h o 7d");
}

const issuer = process.env.JWT_ISSUER || "trailverse-api";
const audience = process.env.JWT_AUDIENCE || "trailverse-client";
const roleNames = Role.schema.path("name").enumValues;

function signAccessToken({ id, role }) {
  if (!id || !roleNames.includes(role)) {
    throw new TypeError("El token requiere un usuario y un rol válido");
  }

  return jsonwebtoken.sign(
    { role },
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

function verifyAccessToken(token) {
  return jsonwebtoken.verify(token, secret, {
    algorithms: ["HS256"],
    issuer,
    audience
  });
}

module.exports = { signAccessToken, verifyAccessToken };
