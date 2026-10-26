const locationsService = require("../services/locations.service");

const getAll = async (req, res, next) => {
  try {
    const locations = await locationsService.getLocations(req.query);
    res.status(200).json({ ok: true, total: locations.length, data: locations });
  } catch (error) { next(error); }
};

const getDeleted = async (req, res, next) => {
  try {
    const locations = await locationsService.getLocationsEliminadas();
    res.status(200).json({ ok: true, total: locations.length, data: locations });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const location = await locationsService.getLocationById(req.params.id);
    res.status(200).json({ ok: true, data: location });
  } catch (error) { next(error); }
};

const getBySlug = async (req, res, next) => {
  try {
    const location = await locationsService.getLocationBySlug(req.params.slug);
    res.status(200).json({ ok: true, data: location });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const location = await locationsService.createLocation(req.body);
    res.status(201).json({ ok: true, message: "Ubicación creada correctamente", data: location });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const location = await locationsService.updateLocation(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Ubicación actualizada correctamente", data: location });
  } catch (error) { next(error); }
};

const activate = async (req, res, next) => {
  try {
    const location = await locationsService.activateLocation(req.params.id);
    res.status(200).json({ ok: true, message: "Ubicación activada correctamente", data: location });
  } catch (error) { next(error); }
};

const deactivate = async (req, res, next) => {
  try {
    const location = await locationsService.deactivateLocation(req.params.id);
    res.status(200).json({ ok: true, message: "Ubicación desactivada correctamente", data: location });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await locationsService.deleteLocation(req.params.id);
    res.status(200).json({ ok: true, message: "Ubicación eliminada correctamente" });
  } catch (error) { next(error); }
};

const restore = async (req, res, next) => {
  try {
    const location = await locationsService.restoreLocation(req.params.id);
    res.status(200).json({ ok: true, message: "Ubicación restaurada correctamente", data: location });
  } catch (error) { next(error); }
};

const hardDelete = async (req, res, next) => {
  try {
    await locationsService.hardDeleteLocation(req.params.id);
    res.status(200).json({ ok: true, message: "Ubicación eliminada definitivamente" });
  } catch (error) { next(error); }
};

module.exports = { getAll, getDeleted, getById, getBySlug, create, update, activate, deactivate, remove, restore, hardDelete };
