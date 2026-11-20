const authService = require("../services/auth.service");
const {
  REFRESH_COOKIE,
  ACCESS_COOKIE,
  opcionesAccess,
  opcionesRefresh,
  opcionesBorradoAccess,
  opcionesBorradoRefresh
} = require("../utils/auth-cookie");

function enviarSesion(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, opcionesAccess(accessToken));
  res.cookie(REFRESH_COOKIE, refreshToken, opcionesRefresh(refreshToken));
}

function borrarSesion(res) {
  res.clearCookie(ACCESS_COOKIE, opcionesBorradoAccess());
  res.clearCookie(REFRESH_COOKIE, opcionesBorradoRefresh());
}

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    enviarSesion(res, { accessToken, refreshToken });
    res.status(200).json({ ok: true, data: { user } });
  } catch (error) { next(error); }
};

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ ok: true, message: "Cuenta creada correctamente", data: user });
  } catch (error) { next(error); }
};

const refresh = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
    enviarSesion(res, { accessToken, refreshToken });
    res.status(200).json({ ok: true, data: { user } });
  } catch (error) {
    if (error.statusCode === 401) borrarSesion(res);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id, req.auth, req.cookies?.[REFRESH_COOKIE]);
    borrarSesion(res);
    res.status(200).json({ ok: true, message: "Sesión cerrada correctamente" });
  } catch (error) { next(error); }
};

const me = (req, res) => {
  res.status(200).json({ ok: true, data: req.user });
};

module.exports = { login, register, refresh, logout, me };
