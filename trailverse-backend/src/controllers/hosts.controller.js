const hostsService = require("../services/hosts.service");

const getAll = async (req, res, next) => {
  try {
    const hosts = await hostsService.getHosts(req.query);
    res.status(200).json({ ok: true, total: hosts.length, data: hosts });
  } catch (error) { next(error); }
};

const getDeleted = async (req, res, next) => {
  try {
    const hosts = await hostsService.getHostsEliminados();
    res.status(200).json({ ok: true, total: hosts.length, data: hosts });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const host = await hostsService.getHostById(req.params.id);
    res.status(200).json({ ok: true, data: host });
  } catch (error) { next(error); }
};

const getBySlug = async (req, res, next) => {
  try {
    const host = await hostsService.getHostBySlug(req.params.slug);
    res.status(200).json({ ok: true, data: host });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const host = await hostsService.createHost(req.body);
    res.status(201).json({ ok: true, message: "Host creado correctamente", data: host });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const host = await hostsService.updateHost(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Host actualizado correctamente", data: host });
  } catch (error) { next(error); }
};

const activate = async (req, res, next) => {
  try {
    const host = await hostsService.activateHost(req.params.id);
    res.status(200).json({ ok: true, message: "Host activado correctamente", data: host });
  } catch (error) { next(error); }
};

const deactivate = async (req, res, next) => {
  try {
    const host = await hostsService.deactivateHost(req.params.id);
    res.status(200).json({ ok: true, message: "Host desactivado correctamente", data: host });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await hostsService.deleteHost(req.params.id);
    res.status(200).json({ ok: true, message: "Host eliminado correctamente" });
  } catch (error) { next(error); }
};

module.exports = { getAll, getDeleted, getById, getBySlug, create, update, activate, deactivate, remove };
