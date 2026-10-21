const departuresService = require("../services/departures.service");

const getAll = async (req, res, next) => {
  try {
    const departures = await departuresService.getDepartures(req.query);
    res.status(200).json({ ok: true, total: departures.length, data: departures });
  } catch (error) { next(error); }
};

const getDeleted = async (req, res, next) => {
  try {
    const departures = await departuresService.getDeparturesEliminados();
    res.status(200).json({ ok: true, total: departures.length, data: departures });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const departure = await departuresService.getDepartureById(req.params.id);
    res.status(200).json({ ok: true, data: departure });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const departure = await departuresService.createDeparture(req.body);
    res.status(201).json({ ok: true, message: "Salida creada correctamente", data: departure });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const departure = await departuresService.updateDeparture(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Salida actualizada correctamente", data: departure });
  } catch (error) { next(error); }
};

const activate = async (req, res, next) => {
  try {
    const departure = await departuresService.activateDeparture(req.params.id);
    res.status(200).json({ ok: true, message: "Salida activada correctamente", data: departure });
  } catch (error) { next(error); }
};

const deactivate = async (req, res, next) => {
  try {
    const departure = await departuresService.deactivateDeparture(req.params.id);
    res.status(200).json({ ok: true, message: "Salida desactivada correctamente", data: departure });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await departuresService.deleteDeparture(req.params.id);
    res.status(200).json({ ok: true, message: "Salida eliminada correctamente" });
  } catch (error) { next(error); }
};

const restore = async (req, res, next) => {
  try {
    const departure = await departuresService.restoreDeparture(req.params.id);
    res.status(200).json({ ok: true, message: "Salida restaurada correctamente", data: departure });
  } catch (error) { next(error); }
};

const hardDelete = async (req, res, next) => {
  try {
    await departuresService.hardDeleteDeparture(req.params.id);
    res.status(200).json({ ok: true, message: "Salida eliminada definitivamente" });
  } catch (error) { next(error); }
};

module.exports = { getAll, getDeleted, getById, create, update, activate, deactivate, remove, restore, hardDelete };
