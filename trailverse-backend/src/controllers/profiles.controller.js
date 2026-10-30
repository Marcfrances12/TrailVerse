const profilesService = require("../services/profiles.service");

const getAll = async (req, res, next) => {
  try {
    const profiles = await profilesService.getProfiles();
    res.status(200).json({ ok: true, total: profiles.length, data: profiles });
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await profilesService.getProfileForUser(req.user, req.user.id);
    res.status(200).json({ ok: true, data: profile });
  } catch (error) { next(error); }
};

const updateMe = async (req, res, next) => {
  try {
    const profile = await profilesService.updateProfileForUser(req.user, req.user.id, req.body);
    res.status(200).json({ ok: true, message: "Perfil actualizado correctamente", data: profile });
  } catch (error) { next(error); }
};

const getByUserId = async (req, res, next) => {
  try {
    const profile = await profilesService.getProfileForUser(req.user, req.params.userId);
    res.status(200).json({ ok: true, data: profile });
  } catch (error) { next(error); }
};

const updateByUserId = async (req, res, next) => {
  try {
    const profile = await profilesService.updateProfileForUser(req.user, req.params.userId, req.body);
    res.status(200).json({ ok: true, message: "Perfil actualizado correctamente", data: profile });
  } catch (error) { next(error); }
};

module.exports = { getAll, getMe, updateMe, getByUserId, updateByUserId };
