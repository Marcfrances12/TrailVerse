const assert = require("node:assert/strict");
const test = require("node:test");
const usersRepo = require("../src/repos/users.repo");
const profilesRepo = require("../src/repos/profiles.repo");
const profilesService = require("../src/services/profiles.service");

const U_ACTIVO = "65a000000000000000000001";
const U_INACTIVO = "65a000000000000000000002";
const U_BORRADO = "65a000000000000000000003";
const U_SIN_PERFIL = "65a000000000000000000004";
const U_HUERFANO = "65a000000000000000000005";

const usuarios = [
  { _id: U_ACTIVO, email: "activo@test.com", isActive: true, deleted_at: null },
  { _id: U_INACTIVO, email: "inactivo@test.com", isActive: false, deleted_at: null },
  { _id: U_BORRADO, email: "borrado@test.com", isActive: false, deleted_at: new Date() },
  { _id: U_SIN_PERFIL, email: "sinperfil@test.com", isActive: true, deleted_at: null }
];

const perfiles = [
  { _id: "66b000000000000000000001", userId: U_ACTIVO, name: "Activo" },
  { _id: "66b000000000000000000002", userId: U_INACTIVO, name: "Inactivo" },
  { _id: "66b000000000000000000003", userId: U_BORRADO, name: "Borrado" },
  { _id: "66b000000000000000000004", userId: U_HUERFANO, name: "Huérfano" }
];

async function conDatos(ejecutar) {
  const originalUsuarios = usersRepo.getAllWithState;
  const originalPerfiles = profilesRepo.getAllRaw;
  usersRepo.getAllWithState = async () => usuarios;
  profilesRepo.getAllRaw = async () => perfiles;
  try {
    return await ejecutar();
  } finally {
    usersRepo.getAllWithState = originalUsuarios;
    profilesRepo.getAllRaw = originalPerfiles;
  }
}

test("el listado incluye usuarios inactivos y oculta perfiles de usuarios eliminados", async () => {
  const resultado = await conDatos(() => profilesService.getProfiles());
  const porNombre = Object.fromEntries(resultado.map((fila) => [fila.name, fila]));

  assert.equal(porNombre.Activo.estado, "ok");
  assert.equal(porNombre.Activo.usuarioActivo, true);
  assert.equal(porNombre.Inactivo.estado, "usuario-inactivo");
  assert.equal(porNombre.Inactivo.usuarioActivo, false);
  assert.equal(porNombre.Borrado, undefined);
});

test("el listado marca perfiles huérfanos y usuarios sin perfil como incidencias", async () => {
  const resultado = await conDatos(() => profilesService.getProfiles());
  const huerfano = resultado.find((fila) => fila.name === "Huérfano");
  const sinPerfil = resultado.find((fila) => fila.userId === U_SIN_PERFIL);

  assert.equal(huerfano.estado, "usuario-no-existe");
  assert.equal(huerfano.email, null);
  assert.equal(sinPerfil.estado, "sin-perfil");
  assert.equal(sinPerfil._id, null);
});

test("soloIncidencias devuelve únicamente perfiles huérfanos y usuarios sin perfil", async () => {
  const resultado = await conDatos(() => profilesService.getProfiles({ soloIncidencias: true }));
  const estados = resultado.map((fila) => fila.estado).sort();

  assert.deepEqual(estados, ["sin-perfil", "usuario-no-existe"]);
});
