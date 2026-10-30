const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
process.env.JWT_SECRET ||= crypto.randomBytes(32).toString("hex");
const password = require("../src/utils/password");
const Role = require("../src/models/role.model");
const Profile = require("../src/models/profile.model");
const User = require("../src/models/user.model");
const { signAccessToken, verifyAccessToken } = require("../src/utils/jwt");
const authService = require("../src/services/auth.service");

function legacyScryptHash(plainText, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(plainText, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

test("genera y verifica hashes Argon2id", async () => {
  const encodedHash = await password.hashPassword("correct-horse-battery-staple");

  assert.match(encodedHash, /^\$argon2id\$/);
  assert.equal(await password.verifyPassword("correct-horse-battery-staple", encodedHash), true);
  assert.equal(await password.verifyPassword("otra contraseña", encodedHash), false);
  assert.equal(password.needsRehash(encodedHash), false);
});

test("verifica hashes scrypt heredados", async () => {
  const encodedHash = legacyScryptHash("contraseña-antigua");

  assert.equal(await password.verifyPassword("contraseña-antigua", encodedHash), true);
  assert.equal(await password.verifyPassword("incorrecta", encodedHash), false);
  assert.equal(password.needsRehash(encodedHash), true);
});

test("rechaza hashes corruptos y formatos placeholder", async () => {
  assert.equal(await password.verifyPassword("secret", "no-es-un-hash"), false);
  assert.equal(await password.verifyPassword("secret", "$2b$12$placeholderhash"), false);
  assert.equal(await password.verifyPassword("secret", "salt:xyz"), false);
});

test("solo admite los roles predefinidos ADMIN y USER", () => {
  assert.equal(new Role({ name: "ADMIN" }).validateSync(), undefined);
  assert.equal(new Role({ name: "USER" }).validateSync(), undefined);
  assert.ok(new Role({ name: "organizer" }).validateSync());
});

test("el JWT firma y verifica el rol actual del usuario", () => {
  const token = signAccessToken({ id: "507f1f77bcf86cd799439011", role: "ADMIN" });
  const payload = verifyAccessToken(token);

  assert.equal(payload.sub, "507f1f77bcf86cd799439011");
  assert.equal(payload.role, "ADMIN");
  assert.equal(typeof payload.jti, "string");
  assert.ok(payload.jti.length > 0);
  assert.throws(() => verifyAccessToken(`${token}alterado`));
  assert.throws(() => signAccessToken({ id: "507f1f77bcf86cd799439011", role: "organizer" }));
});

test("el perfil requiere usuario y nombre; el nombre no pertenece a User", () => {
  const profile = new Profile({
    userId: "507f1f77bcf86cd799439011",
    name: "Ana López",
    avatarUrl: "https://example.com/avatar.png",
    bio: "Senderista",
    phone: "+34123456789"
  });

  assert.equal(profile.validateSync(), undefined);
  assert.ok(new Profile({ userId: "507f1f77bcf86cd799439011" }).validateSync());
  assert.ok(new Profile({ name: "Sin usuario" }).validateSync());
  assert.equal(User.schema.path("name"), undefined);
});

test("AuthService expone login y logout", () => {
  assert.deepEqual(Object.keys(authService), ["login", "logout"]);
});
