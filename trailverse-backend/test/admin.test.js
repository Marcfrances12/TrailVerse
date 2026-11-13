const assert = require("node:assert/strict");
const test = require("node:test");
const adminRepo = require("../src/repos/admin.repo");
const adminService = require("../src/services/admin.service");

test("getResumen devuelve los contadores del repositorio sin modificarlos", async () => {
  const original = adminRepo.resumen;
  const esperado = {
    rutas: { total: 5, activas: 4, eliminadas: 1 },
    localizaciones: { total: 3, activas: 3, eliminadas: 0 },
    categorias: { total: 2, activas: 2, eliminadas: 0 },
    hosts: { total: 2, activas: 1, eliminadas: 1 },
    usuarios: { total: 7, activas: 6, eliminadas: 1 },
    salidas: { total: 9, proximas: 6, abiertas: 4, llenas: 2 }
  };

  adminRepo.resumen = async () => esperado;
  try {
    const resultado = await adminService.getResumen();
    assert.deepEqual(resultado, esperado);
  } finally {
    adminRepo.resumen = original;
  }
});
