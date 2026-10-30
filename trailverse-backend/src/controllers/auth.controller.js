const authService = require("../services/auth.service");
const { AUTH_COOKIE, opcionesSesion, opcionesBorrado } = require("../utils/auth-cookie");

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    res.cookie(AUTH_COOKIE, token, opcionesSesion(token));
    res.status(200).json({ ok: true, data: { user } });
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id, req.auth);
    res.clearCookie(AUTH_COOKIE, opcionesBorrado());
    res.status(200).json({ ok: true, message: "Sesión cerrada correctamente" });
  } catch (error) { next(error); }
};

const me = (req, res) => {
  res.status(200).json({ ok: true, data: req.user });
};

module.exports = { login, logout, me };
