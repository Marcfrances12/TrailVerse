const RevokedToken = require("../models/revoked-token.model");

async function isRevoked(jti) {
  return Boolean(await RevokedToken.exists({ jti, expiresAt: { $gt: new Date() } }));
}

async function revoke({ jti, userId, expiresAt }) {
  try {
    return await RevokedToken.updateOne(
      { jti },
      { $setOnInsert: { jti, userId, expiresAt } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    // Logout is idempotent if concurrent requests revoke the same token.
    if (error.code === 11000) return null;
    throw error;
  }
}

module.exports = { isRevoked, revoke };
