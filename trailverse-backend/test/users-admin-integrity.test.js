const assert = require("node:assert/strict");
const test = require("node:test");
const User = require("../src/models/user.model");
const Role = require("../src/models/role.model");
const integrity = require("../src/services/integrity.service");

// Simula una consulta de Mongoose encadenable (select/populate/lean) que resuelve a `valor`.
function consulta(valor) {
  const cadena = {
    select: () => cadena,
    populate: () => cadena,
    lean: () => cadena,
    then: (resolver, rechazar) => Promise.resolve(valor).then(resolver, rechazar)
  };
  return cadena;
}

const ID_ADMIN = "65a000000000000000000001";
const ID_USER = "65a000000000000000000002";
const ROL_ADMIN = "66b000000000000000000001";
const ROL_USER = "66b000000000000000000002";

function simular({ usuario, otrosAdmins = 0, rolNuevo = { _id: ROL_USER, name: "USER" } }) {
  const originals = {
    findOne: User.findOne,
    countDocuments: User.countDocuments,
    roleFind: Role.find,
    roleFindById: Role.findById
  };

  User.findOne = () => consulta(usuario);
  User.countDocuments = async () => otrosAdmins;
  Role.find = () => consulta([{ _id: ROL_ADMIN }]);
  Role.findById = () => consulta(rolNuevo);

  return () => {
    User.findOne = originals.findOne;
    User.countDocuments = originals.countDocuments;
    Role.find = originals.roleFind;
    Role.findById = originals.roleFindById;
  };
}

const adminActivo = { _id: ID_ADMIN, isActive: true, roleId: { name: "ADMIN" } };
const userActivo = { _id: ID_USER, isActive: true, roleId: { name: "USER" } };

test("no permite dejar el sistema sin ningún administrador activo", async () => {
  const restaurar = simular({ usuario: adminActivo, otrosAdmins: 0 });
  try {
    await assert.rejects(
      integrity.exigirOtroAdminActivo(ID_ADMIN, "desactivar el último administrador"),
      (error) => error.statusCode === 409
    );
  } finally {
    restaurar();
  }
});

test("permite quitar un administrador si queda otro activo", async () => {
  const restaurar = simular({ usuario: adminActivo, otrosAdmins: 1 });
  try {
    await integrity.exigirOtroAdminActivo(ID_ADMIN, "desactivar el último administrador");
  } finally {
    restaurar();
  }
});

test("un usuario que no es administrador se puede quitar sin comprobaciones de admin", async () => {
  const restaurar = simular({ usuario: userActivo, otrosAdmins: 0 });
  try {
    await integrity.exigirOtroAdminActivo(ID_USER, "desactivar el último administrador");
  } finally {
    restaurar();
  }
});

test("un administrador ya inactivo no bloquea su desactivación", async () => {
  const restaurar = simular({ usuario: null, otrosAdmins: 0 });
  try {
    await integrity.exigirOtroAdminActivo(ID_ADMIN, "eliminar el último administrador");
  } finally {
    restaurar();
  }
});

test("no permite cambiar a USER al único administrador activo", async () => {
  const restaurar = simular({ usuario: adminActivo, otrosAdmins: 0, rolNuevo: { _id: ROL_USER, name: "USER" } });
  try {
    await assert.rejects(
      integrity.exigirOtroAdminAlCambiarRol(ID_ADMIN, ROL_USER),
      (error) => error.statusCode === 409
    );
  } finally {
    restaurar();
  }
});

test("mantener el rol ADMIN al único administrador no está bloqueado", async () => {
  const restaurar = simular({ usuario: adminActivo, otrosAdmins: 0, rolNuevo: { _id: ROL_ADMIN, name: "ADMIN" } });
  try {
    await integrity.exigirOtroAdminAlCambiarRol(ID_ADMIN, ROL_ADMIN);
  } finally {
    restaurar();
  }
});
