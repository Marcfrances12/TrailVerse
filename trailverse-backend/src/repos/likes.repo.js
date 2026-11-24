const Like = require("../models/like.model");

const existe = async (userId, rutaId) => Boolean(await Like.exists({ userId, rutaId }));

const crear = async (userId, rutaId) => Like.create({ userId, rutaId });

const eliminar = async (userId, rutaId) => Like.findOneAndDelete({ userId, rutaId }).lean();

const contarDeRuta = async (rutaId) => Like.countDocuments({ rutaId });

const rutaIdsDeUsuario = async (userId) => {
  const likes = await Like.find({ userId }).select("rutaId").sort({ created_at: -1 }).lean();
  return likes.map((like) => like.rutaId);
};

const eliminarDeUsuario = async (userId) => Like.deleteMany({ userId });

const eliminarDeRuta = async (rutaId) => Like.deleteMany({ rutaId });

module.exports = {
  existe,
  crear,
  eliminar,
  contarDeRuta,
  rutaIdsDeUsuario,
  eliminarDeUsuario,
  eliminarDeRuta
};
