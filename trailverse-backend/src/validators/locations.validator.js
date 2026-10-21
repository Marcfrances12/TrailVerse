const { z } = require("zod");

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const geoSchema = z.object({
  type: z.literal("Point").default("Point"),
  coordinates: z
    .array(z.number())
    .length(2, "Las coordenadas deben ser [lng, lat]")
    .refine(
      (coords) => coords[0] >= -180 && coords[0] <= 180,
      "La longitud debe estar entre -180 y 180"
    )
    .refine(
      (coords) => coords[1] >= -90 && coords[1] <= 90,
      "La latitud debe estar entre -90 y 90"
    )
});

const createLocationSchema = z.strictObject({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  provincia: z.string().trim().min(2, "La provincia es obligatoria").max(100),
  comunidad: z.string().trim().min(2, "La comunidad autónoma es obligatoria").max(100),
  pais: z.string().trim().min(2).max(100).default("España"),
  geo: geoSchema.optional()
});

const updateLocationSchema = z
  .object({
    nombre: z.string().trim().min(3).max(100).optional(),
    provincia: z.string().trim().min(2).max(100).optional(),
    comunidad: z.string().trim().min(2).max(100).optional(),
    pais: z.string().trim().min(2).max(100).optional(),
    geo: geoSchema.optional()
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Debes proporcionar al menos un campo para actualizar"
  );

const listLocationsQuerySchema = z.object({
  provincia: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"], { error: "Debe ser true o false" })
    .transform((valor) => valor === "true")
    .optional()
});

module.exports = {
  idParamSchema,
  createLocationSchema,
  updateLocationSchema,
  listLocationsQuerySchema
};
