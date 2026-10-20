/**
 * Genera un SKU único para una salida a partir del slug de su ruta.
 * Formato: DEP-<slug-ruta>-<secuencia>  →  DEP-ruta-del-montgo-001
 */
const generateSku = (rutaSlug, numero) => {
  const slug = String(rutaSlug || "ruta").trim();
  const secuencia = String(numero).padStart(3, "0");
  return `DEP-${slug}-${secuencia}`;
};

module.exports = { generateSku };
