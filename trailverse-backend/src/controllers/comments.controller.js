const commentsService = require("../services/comments.service");

const listarDeRuta = async (req, res, next) => {
  try {
    const resultado = await commentsService.listarDeRuta(req.params.slug, req.query, req.user ?? null);
    res.status(200).json({ ok: true, ...resultado });
  } catch (error) { next(error); }
};

const misComentarios = async (req, res, next) => {
  try {
    const resultado = await commentsService.misComentarios(req.user, req.query);
    res.status(200).json({ ok: true, ...resultado });
  } catch (error) { next(error); }
};

const crear = async (req, res, next) => {
  try {
    const comentario = await commentsService.crear(req.params.slug, req.body, req.user);
    res.status(201).json({ ok: true, message: "Comentario publicado", data: comentario });
  } catch (error) { next(error); }
};

const editar = async (req, res, next) => {
  try {
    const comentario = await commentsService.editar(req.params.id, req.body, req.user);
    res.status(200).json({ ok: true, message: "Comentario actualizado", data: comentario });
  } catch (error) { next(error); }
};

const eliminar = async (req, res, next) => {
  try {
    const datos = await commentsService.eliminar(req.params.id, req.user);
    res.status(200).json({ ok: true, message: "Comentario eliminado", data: datos });
  } catch (error) { next(error); }
};

// ---------- Admin ----------

const listarAdmin = async (req, res, next) => {
  try {
    const resultado = await commentsService.listarAdmin(req.query);
    res.status(200).json({ ok: true, ...resultado });
  } catch (error) { next(error); }
};

const restaurar = async (req, res, next) => {
  try {
    const comentario = await commentsService.restaurar(req.params.id);
    res.status(200).json({ ok: true, message: "Comentario restaurado", data: comentario });
  } catch (error) { next(error); }
};

const eliminarDefinitivo = async (req, res, next) => {
  try {
    const datos = await commentsService.eliminarDefinitivo(req.params.id);
    res.status(200).json({ ok: true, message: "Comentario eliminado definitivamente", data: datos });
  } catch (error) { next(error); }
};

const sentimiento = async (req, res, next) => {
  try {
    const datos = await commentsService.sentimiento();
    res.status(200).json({ ok: true, data: datos });
  } catch (error) { next(error); }
};

module.exports = {
  listarDeRuta,
  misComentarios,
  crear,
  editar,
  eliminar,
  listarAdmin,
  restaurar,
  eliminarDefinitivo,
  sentimiento
};
