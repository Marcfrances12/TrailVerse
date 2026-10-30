const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
const mongoose = require("mongoose");
process.env.JWT_SECRET ||= crypto.randomBytes(32).toString("hex");
const { authenticate } = require("../src/middlewares/auth.middleware");
const { requireAdmin } = require("../src/middlewares/admin.middleware");
const usersRouter = require("../src/routes/users.routes");
const usersRepo = require("../src/repos/users.repo");
const revokedTokensRepo = require("../src/repos/revoked-tokens.repo");
const { signAccessToken, verifyAccessToken } = require("../src/utils/jwt");
const authService = require("../src/services/auth.service");
const RevokedToken = require("../src/models/revoked-token.model");
const {
  isOwnerOrAdmin,
  canAccessUserResource,
  canModifyExperience
} = require("../src/utils/authorization");

const ownerId = "507f1f77bcf86cd799439011";
const otherId = "507f1f77bcf86cd799439012";

test("owner access permits only the matching user and ADMIN", () => {
  assert.equal(isOwnerOrAdmin({ id: ownerId, role: "USER" }, { userId: ownerId }), true);
  assert.equal(isOwnerOrAdmin({ id: otherId, role: "USER" }, { userId: ownerId }), false);
  assert.equal(isOwnerOrAdmin({ id: otherId, role: "ADMIN" }, { userId: ownerId }), true);
  assert.equal(
    isOwnerOrAdmin(
      { id: new mongoose.Types.ObjectId(ownerId), role: "USER" },
      { userId: new mongoose.Types.ObjectId(ownerId) }
    ),
    true
  );
});

test("user-resource and experience policies reuse ownership checks", () => {
  assert.equal(canAccessUserResource({ id: ownerId, role: "USER" }, { _id: ownerId }), true);
  assert.equal(canAccessUserResource({ id: otherId, role: "USER" }, { _id: ownerId }), false);
  assert.equal(canModifyExperience({ id: ownerId, role: "USER" }, { ownerId }), true);
  assert.equal(canModifyExperience({ id: otherId, role: "USER" }, { ownerId }), false);
});

test("admin middleware distingue 401, 403 y acceso ADMIN", () => {
  let unauthorized;
  requireAdmin({ user: null }, {}, (error) => { unauthorized = error; });
  assert.equal(unauthorized.statusCode, 401);

  let forbidden;
  requireAdmin({ user: { role: "USER" } }, {}, (error) => { forbidden = error; });
  assert.equal(forbidden.statusCode, 403);

  let passed = false;
  requireAdmin({ user: { role: "ADMIN" } }, {}, (error) => { passed = !error; });
  assert.equal(passed, true);
});

test("users router autentica antes de comprobar ADMIN", () => {
  const routeMiddlewares = usersRouter.stack
    .filter((layer) => !layer.route)
    .map((layer) => layer.handle);

  assert.equal(routeMiddlewares[0], authenticate);
  assert.equal(routeMiddlewares[1], requireAdmin);
});

test("authentication rechaza un JWT revocado y adjunta su sesión si es válido", async () => {
  const originalGetById = usersRepo.getById;
  const originalIsRevoked = revokedTokensRepo.isRevoked;
  usersRepo.getById = async (id) => ({
    _id: id,
    email: "user@example.com",
    isActive: true,
    roleId: { name: "USER", isActive: true, deleted_at: null },
    profile: { name: "Test User" }
  });

  const token = signAccessToken({ id: ownerId, role: "USER" });
  try {
    revokedTokensRepo.isRevoked = async () => true;
    let revokedError;
    await authenticate({ get: () => `Bearer ${token}` }, {}, (error) => { revokedError = error; });
    assert.equal(revokedError.statusCode, 401);

    revokedTokensRepo.isRevoked = async () => false;
    const req = { get: () => `Bearer ${token}` };
    let passed = false;
    await authenticate(req, {}, (error) => { passed = !error; });
    assert.equal(passed, true);
    assert.equal(req.user.role, "USER");
    assert.equal(req.auth.jti, verifyAccessToken(token).jti);
    assert.ok(req.auth.expiresAt instanceof Date);
  } finally {
    usersRepo.getById = originalGetById;
    revokedTokensRepo.isRevoked = originalIsRevoked;
  }
});

test("logout guarda solo jti y expiración en el repositorio", async () => {
  const originalRevoke = revokedTokensRepo.revoke;
  const expiresAt = new Date(Date.now() + 60_000);
  let saved;
  revokedTokensRepo.revoke = async (record) => { saved = record; };

  try {
    await authService.logout(ownerId, { jti: "unique-token-id", expiresAt });
    assert.deepEqual(saved, { jti: "unique-token-id", userId: ownerId, expiresAt });
    assert.equal(Object.hasOwn(saved, "token"), false);
  } finally {
    revokedTokensRepo.revoke = originalRevoke;
  }
});

test("revocations tienen índice TTL por expiresAt", () => {
  assert.ok(RevokedToken.schema.indexes().some(([keys, options]) => (
    keys.expiresAt === 1 && options.expireAfterSeconds === 0
  )));
});
