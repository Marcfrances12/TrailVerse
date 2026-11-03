const assert = require("node:assert/strict");
const test = require("node:test");
const integrity = require("../src/services/integrity.service");
const usersRepo = require("../src/repos/users.repo");
const profilesRepo = require("../src/repos/profiles.repo");
const usersService = require("../src/services/users.service");

function simularBorrado({ alBorrarUsuario, alBorrarPerfil, despuesDeComprobar }) {
  const originals = {
    comprobar: integrity.comprobarBorradoDefinitivo,
    adminRestante: integrity.exigirOtroAdminActivo,
    hardDelete: usersRepo.hardDelete,
    deleteForUser: profilesRepo.deleteForUser
  };

  integrity.comprobarBorradoDefinitivo = async () => {};
  integrity.exigirOtroAdminActivo = async () => {};
  usersRepo.hardDelete = alBorrarUsuario;
  profilesRepo.deleteForUser = alBorrarPerfil;

  return () => {
    integrity.comprobarBorradoDefinitivo = originals.comprobar;
    integrity.exigirOtroAdminActivo = originals.adminRestante;
    usersRepo.hardDelete = originals.hardDelete;
    profilesRepo.deleteForUser = originals.deleteForUser;
  };
}

test("el borrado definitivo elimina primero el usuario y después su perfil", async () => {
  const llamadas = [];
  const restaurar = simularBorrado({
    alBorrarUsuario: async (id) => {
      llamadas.push("usuario");
      return { _id: id };
    },
    alBorrarPerfil: async () => {
      llamadas.push("perfil");
    }
  });

  try {
    await usersService.hardDeleteUser("65a000000000000000000001");
    assert.deepEqual(llamadas, ["usuario", "perfil"]);
  } finally {
    restaurar();
  }
});

test("si el usuario no existe no se toca su perfil", async () => {
  let perfilBorrado = false;
  const restaurar = simularBorrado({
    alBorrarUsuario: async () => null,
    alBorrarPerfil: async () => {
      perfilBorrado = true;
    }
  });

  try {
    await assert.rejects(usersService.hardDeleteUser("65a000000000000000000001"));
    assert.equal(perfilBorrado, false);
  } finally {
    restaurar();
  }
});
