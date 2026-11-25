const { z } = require("zod");

// Límite de plazas por salida en una sola línea del carrito. El límite real es el stock de la salida,
// que se comprueba en el servicio; este solo evita cantidades absurdas.
const CANTIDAD_MAXIMA = 50;

const objectId = (campo) =>
  z.string({ error: `${campo} es obligatorio` }).trim().regex(/^[a-f\d]{24}$/i, { error: `${campo} no es un ID válido` });

const cantidad = z.coerce
  .number({ error: "La cantidad debe ser un número entero" })
  .int({ error: "La cantidad debe ser un número entero" })
  .min(1, { error: "La cantidad debe ser al menos 1" })
  .max(CANTIDAD_MAXIMA, { error: `La cantidad no puede superar ${CANTIDAD_MAXIMA}` });

const departureParamSchema = z.object({ departureId: objectId("La salida") });

const anadirItemSchema = z.object({
  departureId: objectId("La salida"),
  quantity: cantidad.default(1)
});

const actualizarItemSchema = z.object({ quantity: cantidad });

module.exports = { departureParamSchema, anadirItemSchema, actualizarItemSchema, CANTIDAD_MAXIMA };
