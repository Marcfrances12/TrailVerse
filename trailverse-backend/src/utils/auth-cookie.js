const jsonwebtoken = require("jsonwebtoken");

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const REFRESH_PATH = "/api/auth";

function opcionesBase(path = "/") {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path
  };
}

function opcionesConCaducidad(token, path) {
  const { exp } = jsonwebtoken.decode(token);
  return { ...opcionesBase(path), maxAge: Math.max(exp * 1000 - Date.now(), 0) };
}

function opcionesAccess(token) {
  return opcionesConCaducidad(token, "/");
}

function opcionesRefresh(token) {
  return opcionesConCaducidad(token, REFRESH_PATH);
}

function opcionesBorradoAccess() {
  return opcionesBase("/");
}

function opcionesBorradoRefresh() {
  return opcionesBase(REFRESH_PATH);
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  opcionesAccess,
  opcionesRefresh,
  opcionesBorradoAccess,
  opcionesBorradoRefresh
};
