require("../models/host.readonly.model");
require("../models/location.readonly.model");
const Ruta = require("../models/ruta.readonly.model");
const Location = require("../models/location.readonly.model");

// Solo rutas visibles al público: publicadas, activas y no borradas.
const FILTRO_PUBLICO = { status: "published", isActive: true, deleted_at: null };
const FILTRO_RELACION_ACTIVA = { isActive: true, deleted_at: null };
const ID_MONGO = /^[0-9a-fA-F]{24}$/;
const MAX_BUSQUEDA = 8;

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function obtenerRutaPublica(id) {
  if (!ID_MONGO.test(String(id ?? ""))) return null;

  return Ruta.findOne({ _id: id, ...FILTRO_PUBLICO })
    .populate({ path: "hostId", select: "name", match: FILTRO_RELACION_ACTIVA })
    .populate({ path: "locationId", select: "nombre provincia comunidad pais", match: FILTRO_RELACION_ACTIVA })
    .lean();
}

function puntoDeInicio(ruta) {
  const coordenadas = ruta?.startPoint?.coordinates;
  if (!Array.isArray(coordenadas) || coordenadas.length !== 2) return null;

  const [lng, lat] = coordenadas;
  return { lat, lng };
}

async function buscarRutasPublicas({ texto, dificultad, provincia, limite = MAX_BUSQUEDA }) {
  const filtro = { ...FILTRO_PUBLICO };

  if (dificultad) filtro.dificultad = dificultad;

  if (texto) {
    const patron = new RegExp(escaparRegex(texto), "i");
    filtro.$or = [{ nombre: patron }, { descripcion: patron }];
  }

  if (provincia) {
    const ubicaciones = await Location.find({
      provincia: new RegExp(escaparRegex(provincia), "i"),
      ...FILTRO_RELACION_ACTIVA
    }).distinct("_id");
    filtro.locationId = { $in: ubicaciones };
  }

  const rutas = await Ruta.find(filtro)
    .select("nombre slug dificultad distanciaKm desnivelM duracionHoras circular locationId")
    .populate({ path: "locationId", select: "nombre provincia comunidad", match: FILTRO_RELACION_ACTIVA })
    .sort({ created_at: -1 })
    .limit(Math.min(limite, MAX_BUSQUEDA))
    .lean();

  return rutas.map((ruta) => ({
    id: String(ruta._id),
    nombre: ruta.nombre,
    slug: ruta.slug,
    dificultad: ruta.dificultad,
    distanciaKm: ruta.distanciaKm,
    desnivelM: ruta.desnivelM,
    duracionHoras: ruta.duracionHoras,
    circular: ruta.circular,
    ubicacion: ruta.locationId
      ? { nombre: ruta.locationId.nombre, provincia: ruta.locationId.provincia, comunidad: ruta.locationId.comunidad }
      : null
  }));
}

module.exports = { obtenerRutaPublica, puntoDeInicio, buscarRutasPublicas };
