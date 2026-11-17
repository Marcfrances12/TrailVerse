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

const COINCIDE_CATEGORIA = {
  restaurant: (etiquetas) => /^(restaurant|cafe|bar|pub)$/.test(etiquetas.amenity ?? ""),
  lodging: (etiquetas) => /^(hotel|guest_house|hostel|camp_site|alpine_hut|chalet)$/.test(etiquetas.tourism ?? ""),
  transport: (etiquetas) =>
    etiquetas.highway === "bus_stop" || etiquetas.amenity === "bus_station" || /^(station|halt)$/.test(etiquetas.railway ?? ""),
  parking: (etiquetas) => etiquetas.amenity === "parking"
};

function construirConsulta(categoria, lat, lng, radioM) {
  const filtros = FILTROS_OSM[categoria]
    .map((filtro) => `  nwr(around:${radioM},${lat},${lng})${filtro};`)
    .join("\n");

  return `[out:json][timeout:20];\n(\n${filtros}\n);\nout center;`;
}

// Una sola consulta para varias categorías, con el radio máximo. Luego se filtra por categoría y distancia.
function construirConsultaUnion(categorias, lat, lng, radioM, timeoutS = 60) {
  const filtros = categorias
    .flatMap((categoria) => FILTROS_OSM[categoria])
    .map((filtro) => `  nwr(around:${radioM},${lat},${lng})${filtro};`)
    .join("\n");

  return `[out:json][timeout:${timeoutS}];\n(\n${filtros}\n);\nout center;`;
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
  const { timeoutMs = env.AGENT_TIMEOUT_MS, ...resto } = opciones;

  try {
    respuesta = await fetch(url, {
      ...resto,
      headers: { "User-Agent": env.GEO_USER_AGENT, ...resto.headers },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new GeoError("El servicio de mapas no ha respondido a tiempo");
    }
    throw new GeoError("No se pudo conectar con el servicio de mapas");
  }

  if (!respuesta.ok) {
    const error = new GeoError(
      respuesta.status === 429
        ? "El servicio de mapas está saturado, inténtalo más tarde"
        : "El servicio de mapas ha devuelto un error"
    );
    error.status = respuesta.status;
    throw error;
  }

  return respuesta.json();
}

function normalizarElemento(elemento, lat, lng) {
  const latElemento = elemento.lat ?? elemento.center?.lat;
  const lngElemento = elemento.lon ?? elemento.center?.lon;
  if (latElemento == null || lngElemento == null) return null;

  const etiquetas = elemento.tags ?? {};
  const tipo =
    etiquetas.amenity ?? etiquetas.tourism ?? etiquetas.highway ?? etiquetas.railway ?? "desconocido";

  return {
    nombre: etiquetas.name ?? null,
    tipo,
    etiquetas,
    distanciaM: Math.round(distanciaM(lat, lng, latElemento, lngElemento)),
    lat: Number(latElemento.toFixed(5)),
    lng: Number(lngElemento.toFixed(5))
  };
}

// Reparte los elementos de OSM entre categorías según sus etiquetas y su radio. Quita duplicados por nombre y tipo.
function agruparLugaresPorCategoria(elementos, lat, lng, categorias) {
  const normalizados = elementos
    .map((elemento) => normalizarElemento(elemento, lat, lng))
    .filter(Boolean)
    .sort((a, b) => a.distanciaM - b.distanciaM);

  const agrupados = {};
  for (const { categoria, radioM } of categorias) {
    const vistos = new Set();
    agrupados[categoria] = normalizados
      .filter((lugar) => lugar.distanciaM <= radioM && COINCIDE_CATEGORIA[categoria](lugar.etiquetas))
      .filter((lugar) => {
        const clavePlaza = `${lugar.nombre}|${lugar.tipo}`;
        if (lugar.nombre && vistos.has(clavePlaza)) return false;
        vistos.add(clavePlaza);
        return true;
      })
      .slice(0, MAX_RESULTADOS)
      .map(({ etiquetas, ...lugar }) => lugar);
  }

  return agrupados;
}

const ESTADOS_REINTENTABLES = [429, 502, 503, 504];
const ESPERAS_OVERPASS_MS = [20000, 40000];

// Overpass público se satura a menudo: se reintenta solo ante estados de sobrecarga.
async function buscarLugaresPorCategorias({ lat, lng, categorias, timeoutMs }) {
  const radioMax = Math.max(...categorias.map((c) => c.radioM));
  const categoriasPedidas = categorias.map((c) => c.categoria);
  const opciones = {
    method: "POST",
    timeoutMs,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      data: construirConsultaUnion(categoriasPedidas, lat.toFixed(3), lng.toFixed(3), radioMax)
    })
  };

  for (let intento = 0; ; intento++) {
    try {
      const json = await pedir(env.OVERPASS_URL, opciones);
      return agruparLugaresPorCategoria(json.elements ?? [], lat, lng, categorias);
    } catch (error) {
      const reintentable = ESTADOS_REINTENTABLES.includes(error.status);
      if (!reintentable || intento >= ESPERAS_OVERPASS_MS.length) throw error;
      await new Promise((resolver) => setTimeout(resolver, ESPERAS_OVERPASS_MS[intento]));
    }
  }
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

  const resultados = agruparLugaresPorCategoria(json.elements ?? [], lat, lng, [{ categoria, radioM }])[categoria];

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
  buscarLugaresPorCategorias,
  agruparLugaresPorCategoria,
  geocodificar,
  distanciaM,
  construirConsulta,
  construirConsultaUnion,
  GeoError
};
