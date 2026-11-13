const mongoose = require("mongoose");
const Ruta = require("../models/ruta.model");
const Departure = require("../models/departure.model");
const Image = require("../models/image.model");
const Category = require("../models/category.model");
const Host = require("../models/host.model");
const Location = require("../models/location.model");
const escapeRegex = require("../utils/escapeRegex");


const RUTAS_VISIBLES = { status: "published", isActive: true, deleted_at: null };

const PROYECCION_LISTADO =
  "nombre slug dificultad distanciaKm desnivelM duracionHoras circular locationId hostId categoryIds coverImage";

const POPULATE_LISTADO = [
  { path: "locationId", select: "nombre slug provincia comunidad" },
  { path: "hostId", select: "name slug" },
  { path: "categoryIds", select: "name slug" }
];

const CONFIG_HOME = {
  categories: { campo: "categoryIds", modelo: Category, campoNombre: "name" },
  hosts: { campo: "hostId", modelo: Host, campoNombre: "name" },
  locations: { campo: "locationId", modelo: Location, campoNombre: "nombre" }
};

// Convierte los criterios ya validados en un filtro de MongoDB.
// Solo añade condiciones para los campos que vienen informados.
function construirFiltroRuta(criterios = {}) {
  const filtro = { ...RUTAS_VISIBLES };

  if (criterios.q) {
    filtro.nombre = new RegExp(escapeRegex(criterios.q), "i");
  }

  if (criterios.categoryId?.length) {
    filtro.categoryIds = criterios.categoryMode === "all"
      ? { $all: criterios.categoryId }
      : { $in: criterios.categoryId };
  }

  if (criterios.hostId) filtro.hostId = criterios.hostId;
  if (criterios.locationId) filtro.locationId = criterios.locationId;
  if (criterios.dificultad) filtro.dificultad = criterios.dificultad;
  if (criterios.rutaIds) filtro._id = { $in: criterios.rutaIds };

  return filtro;
}

async function buscarRutas({ criterios, sort, page, limit }) {
  const filtro = construirFiltroRuta(criterios);
  const sentido = sort.descendente ? -1 : 1;
  const orden = { [sort.campo]: sentido, _id: sentido };

  const [items, total] = await Promise.all([
    Ruta.find(filtro)
      .select(PROYECCION_LISTADO)
      .populate(POPULATE_LISTADO)
      .sort(orden)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Ruta.countDocuments(filtro)
  ]);

  return { items, total };
}

const PROYECCION_DETALLE =
  "nombre slug descripcion dificultad distanciaKm desnivelM duracionHoras circular locationId hostId categoryIds coverImage gpxUrl startPoint";

const POPULATE_DETALLE = [
  { path: "locationId", select: "nombre slug provincia comunidad pais" },
  { path: "hostId", select: "name slug" },
  { path: "categoryIds", select: "name slug" }
];

async function buscarRutaVisiblePorSlug(slug) {
  return Ruta.findOne({ slug, ...RUTAS_VISIBLES })
    .select(PROYECCION_DETALLE)
    .populate(POPULATE_DETALLE)
    .lean();
}

async function idDeRutaVisible(slug) {
  return Ruta.findOne({ slug, ...RUTAS_VISIBLES }).select("_id locationId categoryIds").lean();
}

// Rutas visibles de la misma localización o con alguna categoría en común, sin la ruta actual.
async function rutasRelacionadas({ _id, locationId, categoryIds = [] }, limite) {
  const coincidencias = [];
  if (locationId) coincidencias.push({ locationId });
  if (categoryIds.length) coincidencias.push({ categoryIds: { $in: categoryIds } });
  if (coincidencias.length === 0) return [];

  return Ruta.find({ ...RUTAS_VISIBLES, _id: { $ne: _id }, $or: coincidencias })
    .select(PROYECCION_LISTADO)
    .populate(POPULATE_LISTADO)
    .sort({ created_at: -1 })
    .limit(limite)
    .lean();
}

// Salidas abiertas, activas y futuras de una ruta.
async function salidasPublicasDeRuta(rutaId) {
  return Departure.find({
    rutaId,
    isActive: true,
    deleted_at: null,
    status: "open",
    startDate: { $gte: new Date() }
  })
    .select("startDate endDate meetingPoint price capacity stock status")
    .sort({ startDate: 1 })
    .lean();
}

// Imágenes de todas las rutas de la página en una sola consulta.
async function imagenesDeRutas(rutaIds) {
  return imagenesDeEntidades("ruta", rutaIds);
}

// Imágenes de un tipo de entidad (ruta, location, categoria) en una sola consulta.
async function imagenesDeEntidades(entityType, entityIds) {
  return Image.find({ entityType, entityId: { $in: entityIds } })
    .sort({ position: 1 })
    .select("url alt entityId")
    .lean();
}

// Precio más bajo de las salidas abiertas y futuras de cada ruta.
async function preciosDesdeDeRutas(rutaIds) {
  const ahora = new Date();

  return Departure.aggregate([
    {
      $match: {
        rutaId: { $in: rutaIds.map((id) => new mongoose.Types.ObjectId(id)) },
        isActive: true,
        deleted_at: null,
        status: "open",
        startDate: { $gte: ahora }
      }
    },
    { $sort: { "price.amount": 1 } },
    {
      $group: {
        _id: "$rutaId",
        amount: { $first: "$price.amount" },
        currency: { $first: "$price.currency" }
      }
    }
  ]);
}

// Cuenta rutas visibles por categoría, host o location. Solo entidades activas con al menos una ruta.
function etapasConteo(tipo) {
  const { campo, modelo, campoNombre } = CONFIG_HOME[tipo];

  return [
    { $match: RUTAS_VISIBLES },
    { $unwind: `$${campo}` },
    { $group: { _id: `$${campo}`, total: { $sum: 1 } } },
    {
      $lookup: {
        from: modelo.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "doc"
      }
    },
    { $unwind: "$doc" },
    { $match: { "doc.isActive": true, "doc.deleted_at": null } },
    {
      $project: {
        _id: 1,
        nombre: `$doc.${campoNombre}`,
        slug: "$doc.slug",
        total: 1
      }
    }
  ];
}

async function conteosHome(tipo, limite) {
  return Ruta.aggregate([
    ...etapasConteo(tipo),
    { $sort: { total: -1, nombre: 1, _id: 1 } },
    { $limit: limite }
  ]);
}

// Traduce slugs de categoría, host y localización a ids. Devuelve null si algún slug no existe.
async function idsDeSlugs({ categoria, host, localizacion }) {
  const pedidos = [
    { campo: "categoryId", modelo: Category, slugs: categoria ?? [] },
    { campo: "hostId", modelo: Host, slugs: host ? [host] : [] },
    { campo: "locationId", modelo: Location, slugs: localizacion ? [localizacion] : [] }
  ];

  const criterios = {};
  for (const { campo, modelo, slugs } of pedidos) {
    if (slugs.length === 0) continue;

    const docs = await modelo
      .find({ slug: { $in: slugs }, isActive: true, deleted_at: null })
      .select("_id slug")
      .lean();
    const encontrados = new Set(docs.map((doc) => doc.slug));
    if (slugs.some((slug) => !encontrados.has(slug))) return null;

    const ids = docs.map((doc) => doc._id);
    criterios[campo] = campo === "categoryId" ? ids : { $in: ids };
  }

  return criterios;
}

// Rutas cuyo precio más bajo de salida abierta y futura está entre min y max (ambos incluidos).
async function idsRutasPorPrecio({ min, max }) {
  const filas = await Departure.aggregate([
    {
      $match: {
        isActive: true,
        deleted_at: null,
        status: "open",
        startDate: { $gte: new Date() }
      }
    },
    { $group: { _id: "$rutaId", amount: { $min: "$price.amount" } } },
    { $match: { amount: { $gte: min, $lte: max } } }
  ]);

  return filas.map((fila) => fila._id);
}

// Todas las opciones de un filtro, ordenadas por nombre.
async function opcionesFiltro(tipo) {
  return Ruta.aggregate([
    ...etapasConteo(tipo),
    { $sort: { nombre: 1, _id: 1 } }
  ]);
}

module.exports = {
  construirFiltroRuta,
  buscarRutas,
  imagenesDeRutas,
  preciosDesdeDeRutas,
  conteosHome,
  idsDeSlugs,
  idsRutasPorPrecio,
  opcionesFiltro,
  buscarRutaVisiblePorSlug,
  idDeRutaVisible,
  salidasPublicasDeRuta,
  imagenesDeEntidades,
  rutasRelacionadas
};
