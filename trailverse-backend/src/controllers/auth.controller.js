const authService = require("../services/auth.service");

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.status(200).json({ ok: true, data });
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id, req.auth);
    res.status(200).json({ ok: true, message: "Sesión cerrada correctamente" });
  } catch (error) { next(error); }
};

const me = (req, res) => {
  res.status(200).json({ ok: true, data: req.user });
};

module.exports = { login, logout, me };
