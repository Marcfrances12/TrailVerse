const { obtenerRutaPublica } = require("./route-data");

const AVISO_OSM = "Los datos de OpenStreetMap pueden estar desactualizados. Comprueba horarios y disponibilidad en fuentes oficiales.";
const MAX_RESPUESTA_CONSEJO = 600;

function consejosDeRuta(ruta) {
  return (ruta.faqs ?? []).map((faq) => ({
    pregunta: faq.pregunta,
    respuesta: String(faq.respuesta ?? "").slice(0, MAX_RESPUESTA_CONSEJO)
  }));
}

// Lee la guía generada por el script de IA. No consulta OSM ni el modelo en cada visita.
async function obtenerGuia(routeId) {
  const ruta = await obtenerRutaPublica(routeId);
  if (!ruta) return null;

  const guia = ruta.guiaIA ?? null;

  return {
    ruta: { id: String(ruta._id), nombre: ruta.nombre, slug: ruta.slug },
    inicio: guia?.inicio ?? null,
    consejos: consejosDeRuta(ruta),
    pendiente: !guia,
    generadaEn: guia?.generadaEn ?? null,
    lugares: guia?.lugares ?? [],
    resumen: guia?.resumen ?? null,
    fuentes: {
      lugares: "OpenStreetMap (Overpass)",
      resumen: "Generado con IA a partir de los lugares listados"
    },
    aviso: AVISO_OSM
  };
}

module.exports = { obtenerGuia, consejosDeRuta };
