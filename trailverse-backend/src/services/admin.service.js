const adminRepo = require("../repos/admin.repo");

async function getResumen() {
  return adminRepo.resumen();
}

module.exports = { getResumen };
