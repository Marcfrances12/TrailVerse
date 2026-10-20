const Role = require("../models/role.model");

const getAll = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.status(200).json({ ok: true, total: roles.length, data: roles });
  } catch (error) { next(error); }
};

module.exports = { getAll };
