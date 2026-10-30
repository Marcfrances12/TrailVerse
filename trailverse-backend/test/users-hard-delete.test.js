const assert = require("node:assert/strict");
const test = require("node:test");
const integrity = require("../src/services/integrity.service");
const usersRepo = require("../src/repos/users.repo");
const profilesRepo = require("../src/repos/profiles.repo");
const usersService = require("../src/services/users.service");

test("el borrado definitivo elimina primero el usuario y después su perfil", async () => {
  const llamadas = [];
  const originals = {
    comprobar: integrity.comprobarBorradoDefinitivo,
    hardDelete: usersRepo.hardDelete,
    deleteForUser: profilesRepo.deleteForUser
  };

  integrity.comprobarBorradoDefinitivo = async () => {};
  usersRepo.hardDelete = async (id) => {
    llamadas.push("usuario");
    return { _id: id };
  };
  profilesRepo.deleteForUser = async () => {
    llamadas.push("perfil");
  };

  try {
    await usersService.hardDeleteUser("65a000000000000000000001");
    assert.deepEqual(llamadas, ["usuario", "perfil"]);
  } finally {
    integrity.comprobarBorradoDefinitivo = originals.comprobar;
    usersRepo.hardDelete = originals.hardDelete;
    profilesRepo.deleteForUser = originals.deleteForUser;
  }
});

test("si el usuario no existe no se toca su perfil", async () => {
  let perfilBorrado = false;
  const originals = {
    comprobar: integrity.comprobarBorradoDefinitivo,
    hardDelete: usersRepo.hardDelete,
    deleteForUser: profilesRepo.deleteForUser
  };

  integrity.comprobarBorradoDefinitivo = async () => {};
  usersRepo.hardDelete = async () => null;
  profilesRepo.deleteForUser = async () => {
    perfilBorrado = true;
  };

  try {
    await assert.rejects(usersService.hardDeleteUser("65a000000000000000000001"));
    assert.equal(perfilBorrado, false);
  } finally {
    integrity.comprobarBorradoDefinitivo = originals.comprobar;
    usersRepo.hardDelete = originals.hardDelete;
    profilesRepo.deleteForUser = originals.deleteForUser;
  }
});
