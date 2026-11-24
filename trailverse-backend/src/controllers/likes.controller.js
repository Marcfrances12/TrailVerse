const likesService = require("../services/likes.service");

const getEstado = async (req, res, next) => {
  try {
    const datos = await likesService.getEstado(req.params.slug, req.user?.id ?? null);
    res.status(200).json({ ok: true, data: datos });
  } catch (error) { next(error); }
};

const darLike = async (req, res, next) => {
  try {
    const datos = await likesService.darLike(req.params.slug, req.user.id);
    res.status(201).json({ ok: true, message: "Like añadido", data: datos });
  } catch (error) { next(error); }
};

const quitarLike = async (req, res, next) => {
  try {
    const datos = await likesService.quitarLike(req.params.slug, req.user.id);
    res.status(200).json({ ok: true, message: "Like eliminado", data: datos });
  } catch (error) { next(error); }
};

const getMisLikes = async (req, res, next) => {
  try {
    const rutas = await likesService.getMisLikes(req.user.id);
    res.status(200).json({ ok: true, total: rutas.length, data: rutas });
  } catch (error) { next(error); }
};

module.exports = { getEstado, darLike, quitarLike, getMisLikes };
