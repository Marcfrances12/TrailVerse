const rutasService = require("../services/rutas.service");

const getAll = async (req, res, next) => {
  try {
    const rutas = await rutasService.getRutas(req.query, req.user);

    res.status(200).json({
      ok: true,
      total: rutas.length,
      data: rutas
    });
  } catch (error) {
    next(error);
  }
};

const getDeleted = async (req, res, next) => {
  try {
    const rutas = await rutasService.getRutasEliminadas();

    res.status(200).json({
      ok: true,
      total: rutas.length,
      data: rutas
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const ruta = await rutasService.getRutaById(req.params.id, req.user);

    res.status(200).json({
      ok: true,
      data: ruta
    });
  } catch (error) {
    next(error);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const ruta = await rutasService.getRutaBySlug(req.params.slug, req.user);

    res.status(200).json({
      ok: true,
      data: ruta
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const ruta = await rutasService.createRuta(req.body);

    res.status(201).json({
      ok: true,
      message: "Ruta creada correctamente",
      data: ruta
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const ruta = await rutasService.updateRuta(req.params.id, req.body);

    res.status(200).json({
      ok: true,
      message: "Ruta actualizada correctamente",
      data: ruta
    });
  } catch (error) {
    next(error);
  }
};

const activate = async (req, res, next) => {
  try {
    const ruta = await rutasService.activateRuta(req.params.id);

    res.status(200).json({
      ok: true,
      message: "Ruta activada correctamente",
      data: ruta
    });
  } catch (error) {
    next(error);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const ruta = await rutasService.deactivateRuta(req.params.id);

    res.status(200).json({
      ok: true,
      message: "Ruta desactivada correctamente",
      data: ruta
    });
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const ruta = await rutasService.deleteRuta(req.params.id);

    res.status(200).json({
      ok: true,
      message: "Ruta eliminada correctamente",
      data: ruta
    });
  } catch (error) {
    next(error);
  }
};

const restore = async (req, res, next) => {
  try {
    const ruta = await rutasService.restoreRuta(req.params.id);

    res.status(200).json({
      ok: true,
      message: "Ruta restaurada correctamente",
      data: ruta
    });
  } catch (error) {
    next(error);
  }
};

const hardDelete = async (req, res, next) => {
  try {
    await rutasService.hardDeleteRuta(req.params.id);

    res.status(200).json({
      ok: true,
      message: "Ruta eliminada definitivamente"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getDeleted,
  getById,
  getBySlug,
  create,
  update,
  activate,
  deactivate,
  softDelete,
  restore,
  hardDelete
};
