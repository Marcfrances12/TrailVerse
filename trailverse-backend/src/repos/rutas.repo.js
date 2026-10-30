const Ruta = require("../models/ruta.model");
const Host = require("../models/host.model");
const Location = require("../models/location.model");
const Category = require("../models/category.model");

// Una ruta "borrada" tiene deleted_at con fecha. Todas las lecturas y
// modificaciones solo ven las rutas que NO están borradas.
const noBorradas = { deleted_at: null };

const getAll = async (filtros = {}) => {
  return Ruta.find({ ...filtros, ...noBorradas })
    .populate('locationId', 'nombre provincia comunidad pais isActive deleted_at')
    .populate({
      path: 'hostId',
      select: 'name slug isActive deleted_at userId',
      populate: {
        path: 'userId',
        select: 'email isActive deleted_at roleId',
        populate: { path: 'roleId', select: 'name isActive deleted_at' }
      }
    })
    .populate('categoryIds', 'name slug type isActive deleted_at parentId')
    .sort({ created_at: -1 });
};

// Solo las rutas borradas con soft delete (deleted_at con fecha), la última borrada primero
const getDeleted = async () => {
  return Ruta.find({ deleted_at: { $ne: null } }).sort({ deleted_at: -1 });
};

const getById = async (id) => {
  return Ruta.findOne({ _id: id, ...noBorradas })
    .populate('locationId', 'nombre provincia comunidad pais isActive deleted_at')
    .populate({
      path: 'hostId',
      select: 'name slug isActive deleted_at userId',
      populate: {
        path: 'userId',
        select: 'email isActive deleted_at roleId',
        populate: { path: 'roleId', select: 'name isActive deleted_at' }
      }
    })
    .populate('categoryIds', 'name slug type isActive deleted_at parentId');
};

const getAnyById = async (id) => {
  return Ruta.findById(id);
};

const getRelationsById = async (id) => {
  return Ruta.findOne({ _id: id, ...noBorradas }).select("locationId hostId categoryIds");
};

const getBySlug = async (slug) => {
  return Ruta.findOne({ slug, ...noBorradas })
    .populate('locationId', 'nombre provincia comunidad pais isActive deleted_at')
    .populate({
      path: 'hostId',
      select: 'name slug isActive deleted_at userId',
      populate: {
        path: 'userId',
        select: 'email isActive deleted_at roleId',
        populate: { path: 'roleId', select: 'name isActive deleted_at' }
      }
    })
    .populate('categoryIds', 'name slug type isActive deleted_at parentId');
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
    .populate('locationId', 'nombre provincia comunidad pais isActive deleted_at')
    .populate({
      path: 'hostId',
      select: 'name slug isActive deleted_at userId',
      populate: {
        path: 'userId',
        select: 'email isActive deleted_at roleId',
        populate: { path: 'roleId', select: 'name isActive deleted_at' }
      }
    })
    .populate('categoryIds', 'name slug type isActive deleted_at parentId');
};

const setActive = async (id, isActive) => {
  return Ruta.findOneAndUpdate(
    { _id: id, ...noBorradas },
    { isActive },
    { new: true }
  )
    .populate('locationId', 'nombre provincia comunidad pais isActive deleted_at')
    .populate({
      path: 'hostId',
      select: 'name slug isActive deleted_at userId',
      populate: {
        path: 'userId',
        select: 'email isActive deleted_at roleId',
        populate: { path: 'roleId', select: 'name isActive deleted_at' }
      }
    })
    .populate('categoryIds', 'name slug type isActive deleted_at parentId');
};

// Soft delete: no se borra el documento, solo se marca con la fecha
const softDelete = async (id) => {
  return Ruta.findOneAndUpdate(
    { _id: id, ...noBorradas },
    { deleted_at: new Date(), isActive: false },
    { new: true }
  )
    .populate('locationId', 'nombre provincia comunidad pais isActive deleted_at')
    .populate({
      path: 'hostId',
      select: 'name slug isActive deleted_at userId',
      populate: {
        path: 'userId',
        select: 'email isActive deleted_at roleId',
        populate: { path: 'roleId', select: 'name isActive deleted_at' }
      }
    })
    .populate('categoryIds', 'name slug type isActive deleted_at parentId');
};

// Restaura una ruta marcada como borrada (quita el soft delete)
const restore = async (id) => {
  return Ruta.findOneAndUpdate(
    { _id: id, deleted_at: { $ne: null } },
    { deleted_at: null, isActive: true },
    { new: true }
  )
    .populate('locationId', 'nombre provincia comunidad pais isActive deleted_at')
    .populate({
      path: 'hostId',
      select: 'name slug isActive deleted_at userId',
      populate: {
        path: 'userId',
        select: 'email isActive deleted_at roleId',
        populate: { path: 'roleId', select: 'name isActive deleted_at' }
      }
    })
    .populate('categoryIds', 'name slug type isActive deleted_at parentId');
};

// Borrado definitivo: elimina el documento de la base de datos
const hardDelete = async (id) => {
  return Ruta.findByIdAndDelete(id);
};

module.exports = {
  getAll,
  getDeleted,
  getById,
  getAnyById,
  getRelationsById,
  getBySlug,
  slugExists,
  create,
  update,
  setActive,
  softDelete,
  restore,
  hardDelete
};
