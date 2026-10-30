const assert = require("node:assert/strict");
const test = require("node:test");
const usersRepo = require("../src/repos/users.repo");
const profilesRepo = require("../src/repos/profiles.repo");
const authService = require("../src/services/auth.service");
const password = require("../src/utils/password");
const User = require("../src/models/user.model");
const { loginSchema } = require("../src/validators/auth.validator");

test("el login acepta un email o un nombre de usuario en el mismo campo", () => {
  assert.equal(loginSchema.safeParse({ identificador: "marc", password: "marc" }).success, true);
  assert.equal(loginSchema.safeParse({ identificador: "marc@trailverse.com", password: "marc" }).success, true);
  assert.equal(loginSchema.safeParse({ identificador: "   ", password: "marc" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "marc@trailverse.com", password: "marc" }).success, false);
});

test("el usuario acepta letras, números y los signos permitidos, en minúsculas", () => {
  const valido = new User({ username: "Marc_01" }).validateSync();
  const invalido = new User({ username: "no valido!" }).validateSync();

  assert.equal(valido?.errors?.username, undefined);
  assert.ok(invalido?.errors?.username);
});

test("login por nombre de usuario devuelve el rol y el nombre del perfil", async () => {
  const hash = await password.hashPassword("marc");
  const usuario = {
    _id: "65a000000000000000000001",
    email: "marc@trailverse.com",
    isActive: true,
    passwordHash: hash,
    roleId: { name: "ADMIN", isActive: true, deleted_at: null }
  };

  const originals = {
    porEmail: usersRepo.getByEmailForAuthentication,
    porUsuario: usersRepo.getByUsernameForAuthentication,
    perfil: profilesRepo.getByUserId
  };
  usersRepo.getByEmailForAuthentication = async () => null;
  usersRepo.getByUsernameForAuthentication = async (username) => (username === "marc" ? usuario : null);
  profilesRepo.getByUserId = async () => ({ name: "Marc" });

  try {
    const resultado = await authService.login({ identificador: "MARC", password: "marc" });
    assert.equal(resultado.user.role, "ADMIN");
    assert.equal(resultado.user.name, "Marc");
    assert.equal(typeof resultado.token, "string");
  } finally {
    usersRepo.getByEmailForAuthentication = originals.porEmail;
    usersRepo.getByUsernameForAuthentication = originals.porUsuario;
    profilesRepo.getByUserId = originals.perfil;
  }
});

test("login con contraseña incorrecta se rechaza igual que un usuario inexistente", async () => {
  const hash = await password.hashPassword("marc");
  const usuario = {
    _id: "65a000000000000000000001",
    email: "marc@trailverse.com",
    isActive: true,
    passwordHash: hash,
    roleId: { name: "ADMIN", isActive: true, deleted_at: null }
  };

  const originals = {
    porEmail: usersRepo.getByEmailForAuthentication,
    porUsuario: usersRepo.getByUsernameForAuthentication
  };
  usersRepo.getByEmailForAuthentication = async () => null;
  usersRepo.getByUsernameForAuthentication = async () => usuario;

  try {
    await assert.rejects(
      authService.login({ identificador: "marc", password: "incorrecta" }),
      (error) => error.statusCode === 401
    );
  } finally {
    usersRepo.getByEmailForAuthentication = originals.porEmail;
    usersRepo.getByUsernameForAuthentication = originals.porUsuario;
  }
});
