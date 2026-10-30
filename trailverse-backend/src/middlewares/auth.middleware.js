const { verifyAccessToken } = require("../utils/jwt");
const usersRepo = require("../repos/users.repo");
const revokedTokensRepo = require("../repos/revoked-tokens.repo");
const AppError = require("../utils/AppError");
const Role = require("../models/role.model");

const unauthorized = () => AppError.unauthorized("Authentication required");

async function authenticate(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) return next(unauthorized());

  let payload;
  try {
    payload = verifyAccessToken(match[1]);
  } catch {
    return next(unauthorized());
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !/^[a-f\d]{24}$/i.test(payload.sub) ||
    typeof payload.role !== "string" ||
    typeof payload.jti !== "string" ||
    typeof payload.exp !== "number"
  ) return next(unauthorized());

  try {
    const [user, tokenRevoked] = await Promise.all([
      usersRepo.getById(payload.sub),
      revokedTokensRepo.isRevoked(payload.jti)
    ]);
    const role = user?.roleId;
    const validRoles = Role.schema.path("name").enumValues;

    if (
      !user ||
      !user.isActive ||
      !role ||
      typeof role !== "object" ||
      !role.isActive ||
      role.deleted_at ||
      !validRoles.includes(role.name) ||
      role.name !== payload.role ||
      tokenRevoked
    ) return next(unauthorized());

    req.user = {
      id: String(user._id),
      _id: String(user._id),
      name: user.profile?.name ?? null,
      email: user.email,
      role: role.name
    };
    req.auth = {
      jti: payload.jti,
      expiresAt: new Date(payload.exp * 1000)
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authenticate };
