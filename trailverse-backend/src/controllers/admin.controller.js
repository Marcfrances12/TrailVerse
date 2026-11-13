const adminService = require("../services/admin.service");

const getResumen = async (req, res, next) => {
  try {
    const datos = await adminService.getResumen();
    res.status(200).json({ ok: true, data: datos });
  } catch (error) {
    next(error);
  }
};

module.exports = { getResumen };
