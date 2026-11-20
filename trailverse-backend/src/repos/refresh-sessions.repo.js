const RefreshSession = require("../models/refresh-session.model");

const create = async ({ jti, userId, expiresAt }) => {
  return RefreshSession.create({ jti, userId, expiresAt });
};

const getActive = async (jti) => {
  return RefreshSession.findOne({ jti, revokedAt: null, expiresAt: { $gt: new Date() } });
};

// Devuelve null si otra petición ya la rotó o revocó: así una sesión solo se usa una vez.
const revokeIfActive = async (jti) => {
  return RefreshSession.findOneAndUpdate(
    { jti, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
    { new: true }
  );
};

const revoke = async (jti) => {
  return RefreshSession.updateOne({ jti, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

module.exports = { create, getActive, revokeIfActive, revoke };
