const Ruta = require("../models/ruta.model");
const Host = require("../models/host.model");
const Location = require("../models/location.model");
const Category = require("../models/category.model");

// Una ruta "borrada" tiene deleted_at con fecha. Todas las lecturas y
// modificaciones solo ven las rutas que NO están borradas.
const noBorradas = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return Ruta.find({ ...filtros, ...noBorradas })
    .populate('locationId', 'nombre provincia comunidad pais')
    .populate('hostId', 'name slug')
    .populate('categoryIds', 'name slug type')
    .sort({ created_at: -1 });
};

// Solo las rutas borradas con soft delete (deleted_at con fecha), la última borrada primero
const getDeleted = async () => {
  return Ruta.find({ deleted_at: { $ne: null } }).sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return Ruta.findOne({ _id: id, ...noBorradas })
    .populate('locationId', 'nombre provincia comunidad pais')
    .populate('hostId', 'name slug')
    .populate('categoryIds', 'name slug type');
};

const getBySlug = async (slug) => {
  return Ruta.findOne({ slug, ...noBorradas })
    .populate('locationId', 'nombre provincia comunidad pais')
    .populate('hostId', 'name slug')
    .populate('categoryIds', 'name slug type');
};

// Incluye las borradas a propósito: el slug sigue ocupado por el índice único
const slugExists = async (slug, excludeId) => {
  const filtro = { slug };

  if (excludeId) {
    filtro._id = { $ne: excludeId };
  }

  const existe = await Ruta.exists(filtro);
  return Boolean(existe);
};

const create = async (datos) => {
  return Ruta.create(datos);
};

const update = async (id, datos) => {
  return Ruta.findOneAndUpdate({ _id: id, ...noBorradas }, datos, {
    new: true,
    runValidators: true
  })
    .populate('locationId', 'nombre provincia comunidad pais')
    .populate('hostId', 'name slug')
    .populate('categoryIds', 'name slug type');
};

const setActive = async (id, isActive) => {
  return Ruta.findOneAndUpdate(
    { _id: id, ...noBorradas },
    { isActive },
    { new: true }
  )
    .populate('locationId', 'nombre provincia comunidad pais')
    .populate('hostId', 'name slug')
    .populate('categoryIds', 'name slug type');
};

// Soft delete: no se borra el documento, solo se marca con la fecha
const softDelete = async (id) => {
  return Ruta.findOneAndUpdate(
    { _id: id, ...noBorradas },
    { deleted_at: new Date(), isActive: false },
    { new: true }
  )
    .populate('locationId', 'nombre provincia comunidad pais')
    .populate('hostId', 'name slug')
    .populate('categoryIds', 'name slug type');
};

module.exports = {
  getAll,
  getDeleted,
  getById,
  getBySlug,
  slugExists,
  create,
  update,
  setActive,
  softDelete
};
