const assert = require("node:assert/strict");
const test = require("node:test");
const integrity = require("../src/services/integrity.service");
const usersRepo = require("../src/repos/users.repo");
const profilesRepo = require("../src/repos/profiles.repo");
const likesRepo = require("../src/repos/likes.repo");
const commentsRepo = require("../src/repos/comments.repo");
const usersService = require("../src/services/users.service");

function simularBorrado({
  alBorrarUsuario,
  alBorrarPerfil,
  alBorrarLikes = async () => {},
  alBorrarComentarios = async () => {}
}) {
  const originals = {
    comprobar: integrity.comprobarBorradoDefinitivo,
    adminRestante: integrity.exigirOtroAdminActivo,
    hardDelete: usersRepo.hardDelete,
    deleteForUser: profilesRepo.deleteForUser,
    eliminarLikes: likesRepo.eliminarDeUsuario,
    eliminarComentarios: commentsRepo.eliminarDeUsuario
  };

  integrity.comprobarBorradoDefinitivo = async () => {};
  integrity.exigirOtroAdminActivo = async () => {};
  usersRepo.hardDelete = alBorrarUsuario;
  profilesRepo.deleteForUser = alBorrarPerfil;
  likesRepo.eliminarDeUsuario = alBorrarLikes;
  commentsRepo.eliminarDeUsuario = alBorrarComentarios;

  return () => {
    integrity.comprobarBorradoDefinitivo = originals.comprobar;
    integrity.exigirOtroAdminActivo = originals.adminRestante;
    usersRepo.hardDelete = originals.hardDelete;
    profilesRepo.deleteForUser = originals.deleteForUser;
    likesRepo.eliminarDeUsuario = originals.eliminarLikes;
    commentsRepo.eliminarDeUsuario = originals.eliminarComentarios;
  };
}

test("el borrado definitivo elimina primero el usuario y después su perfil, sus likes y sus comentarios", async () => {
  const llamadas = [];
  const restaurar = simularBorrado({
    alBorrarUsuario: async (id) => {
      llamadas.push("usuario");
      return { _id: id };
    },
    alBorrarPerfil: async () => {
      llamadas.push("perfil");
    },
    alBorrarLikes: async () => {
      llamadas.push("likes");
    },
    alBorrarComentarios: async () => {
      llamadas.push("comentarios");
    }
  });

  try {
    await usersService.hardDeleteUser("65a000000000000000000001");
    assert.deepEqual(llamadas, ["usuario", "perfil", "likes", "comentarios"]);
  } finally {
    restaurar();
  }
});

test("si el usuario no existe no se tocan su perfil ni sus likes", async () => {
  let perfilBorrado = false;
  let likesBorrados = false;
  let comentariosBorrados = false;
  const restaurar = simularBorrado({
    alBorrarUsuario: async () => null,
    alBorrarPerfil: async () => {
      perfilBorrado = true;
    },
    alBorrarLikes: async () => {
      likesBorrados = true;
    },
    alBorrarComentarios: async () => {
      comentariosBorrados = true;
    }
  });

  try {
    await assert.rejects(usersService.hardDeleteUser("65a000000000000000000001"));
    assert.equal(perfilBorrado, false);
    assert.equal(likesBorrados, false);
    assert.equal(comentariosBorrados, false);
  } finally {
    restaurar();
  }
});
