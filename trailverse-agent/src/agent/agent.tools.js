const geo = require("./geo.client");
const { buscarFaqs } = require("./faq-search");
const { obtenerRutaPublica, puntoDeInicio } = require("./route-data");

const CATEGORIAS = ["restaurant", "lodging", "transport", "parking"];
const RADIO_MIN_M = 100;
const RADIO_MAX_M = 5000;
const RADIO_DEFECTO_M = 2000;
const MAX_CONSULTA = 200;
const MAX_LUGAR = 120;

const AVISO_OSM = "Los datos de OpenStreetMap pueden estar desactualizados. Comprueba horarios y disponibilidad en fuentes oficiales.";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_route_info",
      description:
        "Devuelve los datos públicos de una ruta: dificultad, distancia, desnivel, duración, si es circular, ubicación, host y punto de inicio. Úsala antes de responder sobre la ruta actual.",
      parameters: {
        type: "object",
        properties: {
          routeId: {
            type: "string",
            description: "ID de MongoDB de la ruta. Se omite si ya hay una ruta seleccionada."
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_faqs",
      description:
        "Busca en las preguntas frecuentes de una ruta (perros, agua, material, época, etc.). Devuelve las FAQs relacionadas con la consulta.",
      parameters: {
        type: "object",
        properties: {
          routeId: {
            type: "string",
            description: "ID de MongoDB de la ruta. Se omite si ya hay una ruta seleccionada."
          },
          query: {
            type: "string",
            description: "Pregunta del usuario o palabras clave.",
            maxLength: MAX_CONSULTA
          }
        },
        required: ["query"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_nearby_places",
      description:
        "Busca lugares cercanos en OpenStreetMap: restaurantes y bares, alojamientos, transporte público o aparcamientos. Si no se dan coordenadas, usa el punto de inicio de la ruta seleccionada.",
      parameters: {
        type: "object",
        properties: {
          lat: { type: "number", description: "Latitud. Opcional si hay ruta seleccionada." },
          lng: { type: "number", description: "Longitud. Opcional si hay ruta seleccionada." },
          category: { type: "string", enum: CATEGORIAS, description: "Tipo de lugar a buscar." },
          radiusMeters: {
            type: "integer",
            minimum: RADIO_MIN_M,
            maximum: RADIO_MAX_M,
            description: "Radio de búsqueda en metros. Por defecto 2000."
          }
        },
        required: ["category"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "geocode_place",
      description:
        "Convierte el nombre de un pueblo, zona o lugar en coordenadas (Nominatim). Úsala cuando el usuario mencione un lugar que no es la ruta actual.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Nombre del lugar.", maxLength: MAX_LUGAR }
        },
        required: ["query"],
        additionalProperties: false
      }
    }
  }
];

function idDeRuta(args, contexto) {
  return contexto.routeId ?? args.routeId ?? null;
}

async function getRouteInfo(args, contexto) {
  const id = idDeRuta(args, contexto);
  if (!id) return { error: "No hay ninguna ruta seleccionada" };

  const ruta = await obtenerRutaPublica(id);
  if (!ruta) return { encontrada: false, mensaje: "No hay ninguna ruta publicada con ese identificador" };

  const inicio = puntoDeInicio(ruta);

  return {
    encontrada: true,
    nombre: ruta.nombre,
    descripcion: ruta.descripcion,
    dificultad: ruta.dificultad,
    distanciaKm: ruta.distanciaKm,
    desnivelM: ruta.desnivelM,
    duracionHoras: ruta.duracionHoras,
    circular: ruta.circular,
    ubicacion: ruta.locationId
      ? {
          nombre: ruta.locationId.nombre,
          provincia: ruta.locationId.provincia,
          comunidad: ruta.locationId.comunidad,
          pais: ruta.locationId.pais
        }
      : null,
    organizador: ruta.hostId ? ruta.hostId.name : null,
    puntoInicio: inicio,
    numeroFaqs: (ruta.faqs ?? []).length
  };
}

async function searchFaqs(args, contexto) {
  const id = idDeRuta(args, contexto);
  if (!id) return { error: "No hay ninguna ruta seleccionada" };

  const consulta = String(args.query ?? "").slice(0, MAX_CONSULTA);
  const ruta = await obtenerRutaPublica(id);
  if (!ruta) return { encontrada: false, mensaje: "No hay ninguna ruta publicada con ese identificador" };

  const faqs = buscarFaqs(ruta.faqs ?? [], consulta);
  if (faqs.length === 0) {
    return { encontradas: false, mensaje: "No hay FAQs de esta ruta relacionadas con la consulta" };
  }

  return { encontradas: true, faqs };
}

async function searchNearbyPlaces(args, contexto) {
  const categoria = args.category;
  if (!CATEGORIAS.includes(categoria)) {
    return { error: `Categoría no válida. Usa una de: ${CATEGORIAS.join(", ")}` };
  }

  let lat = args.lat;
  let lng = args.lng;
  let origen = "coordenadas indicadas";

  if (lat == null || lng == null) {
    const ruta = contexto.routeId ? await obtenerRutaPublica(contexto.routeId) : null;
    const inicio = puntoDeInicio(ruta);
    if (!inicio) return { error: "Indica coordenadas o selecciona una ruta con punto de inicio" };

    ({ lat, lng } = inicio);
    origen = "punto de inicio de la ruta";
  }

  if (typeof lat !== "number" || lat < -90 || lat > 90 || typeof lng !== "number" || lng < -180 || lng > 180) {
    return { error: "Coordenadas no válidas" };
  }

  const radioM = Math.min(
    RADIO_MAX_M,
    Math.max(RADIO_MIN_M, Number(args.radiusMeters) || RADIO_DEFECTO_M)
  );

  const resultados = await geo.buscarLugaresCercanos({ lat, lng, categoria, radioM });

  return {
    categoria,
    radioM,
    origen,
    resultados,
    mensaje: resultados.length === 0 ? "No se han encontrado resultados en ese radio" : undefined,
    fuente: "OpenStreetMap (Overpass)",
    aviso: AVISO_OSM
  };
}

async function geocodePlace(args) {
  const consulta = String(args.query ?? "").trim().slice(0, MAX_LUGAR);
  if (!consulta) return { error: "Indica el nombre de un lugar" };

  const resultados = await geo.geocodificar(consulta);

  return {
    resultados,
    mensaje: resultados.length === 0 ? "No se ha encontrado ese lugar" : undefined,
    fuente: "OpenStreetMap (Nominatim)"
  };
}

const EJECUTORES = {
  get_route_info: getRouteInfo,
  search_faqs: searchFaqs,
  search_nearby_places: searchNearbyPlaces,
  geocode_place: geocodePlace
};

// Nunca lanza: cualquier fallo se devuelve al modelo como dato de error.
async function ejecutarTool(nombre, argumentosCrudos, contexto) {
  let args;
  try {
    args = argumentosCrudos ? JSON.parse(argumentosCrudos) : {};
  } catch {
    return { error: "Argumentos no válidos" };
  }

  const ejecutor = EJECUTORES[nombre];
  if (!ejecutor) return { error: `Herramienta desconocida: ${nombre}` };

  try {
    return await ejecutor(args, contexto);
  } catch (error) {
    if (error instanceof geo.GeoError) return { error: error.message };
    console.error("[agent] fallo en tool", nombre, error.message);
    return { error: "La consulta no se ha podido completar" };
  }
}

module.exports = { TOOLS, ejecutarTool };
