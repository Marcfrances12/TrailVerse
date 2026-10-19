const locationsService = require("../services/locations.service");

const getAll = async (req, res, next) => {
  try {
    const locations = await locationsService.getLocations(req.query);
    res.status(200).json({ ok: true, total: locations.length, data: locations });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const location = await locationsService.getLocationById(req.params.id);
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

const remove = async (req, res, next) => {
  try {
    await locationsService.deleteLocation(req.params.id);
    res.status(200).json({ ok: true, message: "Ubicación eliminada correctamente" });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
