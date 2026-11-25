const mongoose = require("mongoose");
const Comment = require("../models/comment.model");
const escapeRegex = require("../utils/escapeRegex");
// Modelos usados en populate: se registran aquí para no depender del orden de carga.
require("../models/user.model");
require("../models/ruta.model");

const ACTIVOS = { deleted_at: null };

const POPULATE_AUTOR = {
  path: "userId",
  select: "username",
  populate: { path: "profile", select: "name avatarUrl" }
};

const POPULATE_RUTA = { path: "rutaId", select: "nombre slug" };

const aObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const getActivoById = async (id) => Comment.findOne({ _id: id, ...ACTIVOS }).lean();

const getAnyById = async (id) => Comment.findById(id).lean();

const existeDeUsuario = async (userId, rutaId) =>
  Boolean(await Comment.exists({ userId, rutaId, ...ACTIVOS }));

const crear = async (datos) => Comment.create(datos);

const getConAutor = async (id) => Comment.findById(id).populate(POPULATE_AUTOR).lean();

// Al cambiar el texto, el sentimiento anterior deja de valer y queda pendiente de analizar.
const actualizar = async (id, cambios) => {
  const set = { ...cambios };
  if (cambios.texto !== undefined) set.sentimiento = null;
  return Comment.findOneAndUpdate({ _id: id, ...ACTIVOS }, { $set: set }, { new: true, runValidators: true })
    .populate(POPULATE_AUTOR)
    .lean();
};

const softDelete = async (id, deletedBy) =>
  Comment.findOneAndUpdate(
    { _id: id, ...ACTIVOS },
    { $set: { deleted_at: new Date(), deletedBy } },
    { new: true }
  ).lean();

const restaurar = async (id) =>
  Comment.findOneAndUpdate(
    { _id: id, deleted_at: { $ne: null } },
    { $set: { deleted_at: null, deletedBy: null } },
    { new: true }
  )
    .populate(POPULATE_AUTOR)
    .populate(POPULATE_RUTA)
    .lean();

const hardDelete = async (id) => Comment.findByIdAndDelete(id).lean();

async function listarDeRuta(rutaId, { page, limit }) {
  const filtro = { rutaId, ...ACTIVOS };
  const [items, total] = await Promise.all([
    Comment.find(filtro)
      .populate(POPULATE_AUTOR)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Comment.countDocuments(filtro)
  ]);
  return { items, total };
}

// Media y reparto de estrellas (1..5) de los comentarios activos de una ruta.
async function estadisticasDeRuta(rutaId) {
  const [resultado] = await Comment.aggregate([
    { $match: { rutaId: aObjectId(rutaId), ...ACTIVOS } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        media: { $avg: "$valoracion" },
        e1: { $sum: { $cond: [{ $eq: ["$valoracion", 1] }, 1, 0] } },
        e2: { $sum: { $cond: [{ $eq: ["$valoracion", 2] }, 1, 0] } },
        e3: { $sum: { $cond: [{ $eq: ["$valoracion", 3] }, 1, 0] } },
        e4: { $sum: { $cond: [{ $eq: ["$valoracion", 4] }, 1, 0] } },
        e5: { $sum: { $cond: [{ $eq: ["$valoracion", 5] }, 1, 0] } }
      }
    }
  ]);

  if (!resultado) return { total: 0, media: null, reparto: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  return {
    total: resultado.total,
    media: Math.round(resultado.media * 10) / 10,
    reparto: { 1: resultado.e1, 2: resultado.e2, 3: resultado.e3, 4: resultado.e4, 5: resultado.e5 }
  };
}

// Comentarios activos de un usuario, con la ruta (para "Mis opiniones" del perfil).
async function listarDeUsuario(userId, { page, limit }) {
  const filtro = { userId, ...ACTIVOS };
  const [items, total] = await Promise.all([
    Comment.find(filtro)
      .populate(POPULATE_AUTOR)
      .populate({ ...POPULATE_RUTA, select: "nombre slug status isActive deleted_at" })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Comment.countDocuments(filtro)
  ]);
  return { items, total };
}

function filtroAdmin({ rutaId, userId, sentimiento, estado, q }) {
  const filtro = {};
  if (estado === "activos") filtro.deleted_at = null;
  else if (estado === "eliminados") filtro.deleted_at = { $ne: null };
  if (rutaId) filtro.rutaId = rutaId;
  if (userId) filtro.userId = userId;
  if (sentimiento === "pendiente") filtro.sentimiento = null;
  else if (sentimiento) filtro["sentimiento.etiqueta"] = sentimiento;
  if (q) filtro.texto = new RegExp(escapeRegex(q), "i");
  return filtro;
}

async function listarAdmin(opciones) {
  const filtro = filtroAdmin(opciones);
  const { page, limit } = opciones;
  const [items, total] = await Promise.all([
    Comment.find(filtro)
      .populate(POPULATE_AUTOR)
      .populate(POPULATE_RUTA)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Comment.countDocuments(filtro)
  ]);
  return { items, total };
}

// Sentimiento agregado por ruta para el dashboard: solo comentarios activos.
async function sentimientoPorRuta() {
  return Comment.aggregate([
    { $match: { ...ACTIVOS } },
    {
      $group: {
        _id: "$rutaId",
        total: { $sum: 1 },
        media: { $avg: "$valoracion" },
        positivos: { $sum: { $cond: [{ $eq: ["$sentimiento.etiqueta", "positivo"] }, 1, 0] } },
        neutros: { $sum: { $cond: [{ $eq: ["$sentimiento.etiqueta", "neutro"] }, 1, 0] } },
        negativos: { $sum: { $cond: [{ $eq: ["$sentimiento.etiqueta", "negativo"] }, 1, 0] } },
        puntuacionMedia: { $avg: "$sentimiento.puntuacion" },
        temas: { $push: "$sentimiento.temas" },
        ultimo: { $max: "$created_at" }
      }
    },
    { $lookup: { from: "rutas", localField: "_id", foreignField: "_id", as: "ruta" } },
    { $unwind: "$ruta" },
    { $match: { "ruta.deleted_at": null } },
    {
      $project: {
        _id: 0,
        rutaId: "$_id",
        nombre: "$ruta.nombre",
        slug: "$ruta.slug",
        total: 1,
        media: 1,
        positivos: 1,
        neutros: 1,
        negativos: 1,
        puntuacionMedia: 1,
        temas: 1,
        ultimo: 1
      }
    }
  ]);
}

const eliminarDeUsuario = async (userId) => Comment.deleteMany({ userId });

const eliminarDeRuta = async (rutaId) => Comment.deleteMany({ rutaId });

module.exports = {
  getActivoById,
  getAnyById,
  existeDeUsuario,
  crear,
  getConAutor,
  actualizar,
  softDelete,
  restaurar,
  hardDelete,
  listarDeRuta,
  estadisticasDeRuta,
  listarAdmin,
  listarDeUsuario,
  sentimientoPorRuta,
  eliminarDeUsuario,
  eliminarDeRuta
};
