require("../models/host.readonly.model");
require("../models/location.readonly.model");
const Ruta = require("../models/ruta.readonly.model");

// Solo rutas visibles al público: publicadas, activas y no borradas.
const FILTRO_PUBLICO = { status: "published", isActive: true, deleted_at: null };
const FILTRO_RELACION_ACTIVA = { isActive: true, deleted_at: null };
const ID_MONGO = /^[0-9a-fA-F]{24}$/;

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

module.exports = { obtenerRutaPublica, puntoDeInicio };
