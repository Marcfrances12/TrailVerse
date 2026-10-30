const jsonwebtoken = require("jsonwebtoken");

const AUTH_COOKIE = "trailverse_session";

function opcionesBase() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

function opcionesSesion(token) {
  const { exp } = jsonwebtoken.decode(token);
  return { ...opcionesBase(), maxAge: Math.max(exp * 1000 - Date.now(), 0) };
}

function opcionesBorrado() {
  return opcionesBase();
}

module.exports = { AUTH_COOKIE, opcionesSesion, opcionesBorrado };
