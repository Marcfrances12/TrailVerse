const rolesService = require("../services/roles.service");

const getAll = async (req, res, next) => {
  try {
    const roles = await rolesService.getRoles(req.query);
    res.status(200).json({ ok: true, total: roles.length, data: roles });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    res.status(200).json({ ok: true, data: role });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById };
