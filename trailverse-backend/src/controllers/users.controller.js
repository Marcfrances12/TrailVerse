const usersService = require("../services/users.service");

const getAll = async (req, res, next) => {
  try {
    const users = await usersService.getUsers(req.query);
    res.status(200).json({ ok: true, total: users.length, data: users });
  } catch (error) { next(error); }
};

const getDeleted = async (req, res, next) => {
  try {
    const users = await usersService.getUsersEliminados();
    res.status(200).json({ ok: true, total: users.length, data: users });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.status(200).json({ ok: true, data: user });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({ ok: true, message: "Usuario creado correctamente", data: user });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Usuario actualizado correctamente", data: user });
  } catch (error) { next(error); }
};

const activate = async (req, res, next) => {
  try {
    const user = await usersService.activateUser(req.params.id);
    res.status(200).json({ ok: true, message: "Usuario activado correctamente", data: user });
  } catch (error) { next(error); }
};

const deactivate = async (req, res, next) => {
  try {
    const user = await usersService.deactivateUser(req.params.id);
    res.status(200).json({ ok: true, message: "Usuario desactivado correctamente", data: user });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await usersService.deleteUser(req.params.id);
    res.status(200).json({ ok: true, message: "Usuario eliminado correctamente" });
  } catch (error) { next(error); }
};

module.exports = { getAll, getDeleted, getById, create, update, activate, deactivate, remove };
