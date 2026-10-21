const rolesService = require("../services/roles.service");

const getAll = async (req, res, next) => {
  try {
    const roles = await rolesService.getRoles(req.query);
    res.status(200).json({ ok: true, total: roles.length, data: roles });
  } catch (error) { next(error); }
};

const getDeleted = async (req, res, next) => {
  try {
    const roles = await rolesService.getRolesEliminados();
    res.status(200).json({ ok: true, total: roles.length, data: roles });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    res.status(200).json({ ok: true, data: role });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const role = await rolesService.createRole(req.body);
    res.status(201).json({ ok: true, message: "Rol creado correctamente", data: role });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const role = await rolesService.updateRole(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Rol actualizado correctamente", data: role });
  } catch (error) { next(error); }
};

const activate = async (req, res, next) => {
  try {
    const role = await rolesService.activateRole(req.params.id);
    res.status(200).json({ ok: true, message: "Rol activado correctamente", data: role });
  } catch (error) { next(error); }
};

const deactivate = async (req, res, next) => {
  try {
    const role = await rolesService.deactivateRole(req.params.id);
    res.status(200).json({ ok: true, message: "Rol desactivado correctamente", data: role });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await rolesService.deleteRole(req.params.id);
    res.status(200).json({ ok: true, message: "Rol eliminado correctamente" });
  } catch (error) { next(error); }
};

const restore = async (req, res, next) => {
  try {
    const role = await rolesService.restoreRole(req.params.id);
    res.status(200).json({ ok: true, message: "Rol restaurado correctamente", data: role });
  } catch (error) { next(error); }
};

const hardDelete = async (req, res, next) => {
  try {
    await rolesService.hardDeleteRole(req.params.id);
    res.status(200).json({ ok: true, message: "Rol eliminado definitivamente" });
  } catch (error) { next(error); }
};

module.exports = { getAll, getDeleted, getById, create, update, activate, deactivate, remove, restore, hardDelete };
