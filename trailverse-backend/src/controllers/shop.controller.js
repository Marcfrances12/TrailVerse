const shopService = require("../services/shop.service");

const getRutas = async (req, res, next) => {
  try {
    const resultado = await shopService.getRutas(req.query); 

    res.status(200).json({
      ok: true,
      total: resultado.total,
      page: resultado.page,
      limit: resultado.limit,
      totalPages: resultado.totalPages,
      data: resultado.data
    });
  } catch (error) {
    next(error);
  }
};

const getHome = async (req, res, next) => {
  try {
    const datos = await shopService.getHome(req.query);
    res.status(200).json({ ok: true, data: datos });
  } catch (error) {
    next(error);
  }
};

const getFiltros = async (req, res, next) => {
  try {
    const datos = await shopService.getFiltros();
    res.status(200).json({ ok: true, data: datos });
  } catch (error) {
    next(error);
  }
};

const getRuta = async (req, res, next) => {
  try {
    const ruta = await shopService.getRuta(req.params.slug);
    res.status(200).json({ ok: true, data: ruta });
  } catch (error) {
    next(error);
  }
};

const getSalidas = async (req, res, next) => {
  try {
    const salidas = await shopService.getSalidas(req.params.slug);
    res.status(200).json({ ok: true, total: salidas.length, data: salidas });
  } catch (error) {
    next(error);
  }
};

const getRelacionadas = async (req, res, next) => {
  try {
    const rutas = await shopService.getRelacionadas(req.params.slug);
    res.status(200).json({ ok: true, total: rutas.length, data: rutas });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRutas, getHome, getFiltros, getRuta, getSalidas, getRelacionadas };
