const { env } = require("../config/env");
const { TTLCache } = require("./cache");

const TTL_MS = 60 * 60 * 1000;
const MAX_RESULTADOS = 8;
const MAX_GEOCODIFICACIONES = 3;
const INTERVALO_NOMINATIM_MS = 1000;

const cache = new TTLCache({ ttlMs: TTL_MS, maxEntries: 500 });

class GeoError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeoError";
  }
}

const FILTROS_OSM = {
  restaurant: ['["amenity"~"^(restaurant|cafe|bar|pub)$"]'],
  lodging: ['["tourism"~"^(hotel|guest_house|hostel|camp_site|alpine_hut|chalet)$"]'],
  transport: ['["highway"="bus_stop"]', '["amenity"="bus_station"]', '["railway"~"^(station|halt)$"]'],
  parking: ['["amenity"="parking"]']
};

function construirConsulta(categoria, lat, lng, radioM) {
  const filtros = FILTROS_OSM[categoria]
    .map((filtro) => `  nwr(around:${radioM},${lat},${lng})${filtro};`)
    .join("\n");

  return `[out:json][timeout:20];\n(\n${filtros}\n);\nout center;`;
}

function distanciaM(lat1, lng1, lat2, lng2) {
  const radio = 6371000;
  const aRadianes = (grados) => (grados * Math.PI) / 180;
  const dLat = aRadianes(lat2 - lat1);
  const dLng = aRadianes(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * radio * Math.asin(Math.sqrt(a));
}

async function pedir(url, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers: { "User-Agent": env.GEO_USER_AGENT, ...opciones.headers },
      signal: AbortSignal.timeout(env.AGENT_TIMEOUT_MS)
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new GeoError("El servicio de mapas no ha respondido a tiempo");
    }
    throw new GeoError("No se pudo conectar con el servicio de mapas");
  }

  if (!respuesta.ok) {
    throw new GeoError(
      respuesta.status === 429
        ? "El servicio de mapas está saturado, inténtalo más tarde"
        : "El servicio de mapas ha devuelto un error"
    );
  }

  return respuesta.json();
}

async function buscarLugaresCercanos({ lat, lng, categoria, radioM }) {
  const latRedondeada = Number(lat.toFixed(3));
  const lngRedondeada = Number(lng.toFixed(3));
  const clave = `overpass:${categoria}:${latRedondeada}:${lngRedondeada}:${radioM}`;

  const enCache = cache.get(clave);
  if (enCache) return enCache;

  const json = await pedir(env.OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      data: construirConsulta(categoria, latRedondeada, lngRedondeada, radioM)
    })
  });

  const vistos = new Set();
  const resultados = (json.elements ?? [])
    .map((elemento) => {
      const latElemento = elemento.lat ?? elemento.center?.lat;
      const lngElemento = elemento.lon ?? elemento.center?.lon;
      if (latElemento == null || lngElemento == null) return null;

      const etiquetas = elemento.tags ?? {};
      const nombre = etiquetas.name ?? null;
      const tipo =
        etiquetas.amenity ?? etiquetas.tourism ?? etiquetas.highway ?? etiquetas.railway ?? "desconocido";

      return {
        nombre,
        tipo,
        distanciaM: Math.round(distanciaM(lat, lng, latElemento, lngElemento)),
        lat: Number(latElemento.toFixed(5)),
        lng: Number(lngElemento.toFixed(5))
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanciaM - b.distanciaM)
    .filter((lugar) => {
      const clavePlaza = `${lugar.nombre}|${lugar.tipo}`;
      if (lugar.nombre && vistos.has(clavePlaza)) return false;
      vistos.add(clavePlaza);
      return true;
    })
    .slice(0, MAX_RESULTADOS);

  cache.set(clave, resultados);
  return resultados;
}

let siguienteTurnoNominatim = 0;

// Reserva el siguiente hueco de 1 s antes de llamar, para cumplir la política de Nominatim.
async function esperarTurnoNominatim() {
  const ahora = Date.now();
  const inicio = Math.max(ahora, siguienteTurnoNominatim);
  siguienteTurnoNominatim = inicio + INTERVALO_NOMINATIM_MS;

  if (inicio > ahora) {
    await new Promise((resolver) => setTimeout(resolver, inicio - ahora));
  }
}

async function geocodificar(consulta) {
  const clave = `nominatim:${consulta.toLowerCase()}`;

  const enCache = cache.get(clave);
  if (enCache) return enCache;

  await esperarTurnoNominatim();

  const url = `${env.NOMINATIM_URL}/search?${new URLSearchParams({
    q: consulta,
    format: "jsonv2",
    limit: String(MAX_GEOCODIFICACIONES),
    "accept-language": "es"
  })}`;

  const json = await pedir(url, { headers: { Accept: "application/json" } });

  const resultados = json.slice(0, MAX_GEOCODIFICACIONES).map((lugar) => ({
    nombre: lugar.display_name,
    tipo: lugar.type ?? lugar.class ?? null,
    lat: Number(lugar.lat),
    lng: Number(lugar.lon)
  }));

  cache.set(clave, resultados);
  return resultados;
}

module.exports = {
  buscarLugaresCercanos,
  geocodificar,
  distanciaM,
  construirConsulta,
  GeoError
};
