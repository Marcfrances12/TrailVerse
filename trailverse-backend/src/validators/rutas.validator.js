const { z } = require("zod");

const DIFICULTADES = ["facil", "media", "dificil"];
const STATUS = ["draft", "published", "archived"];

const textoObligatorio = (campo, min = 1) =>
  z
    .string({ error: `${campo} es obligatorio y debe ser texto` })
    .trim()
    .min(min, { error: `${campo} debe tener al menos ${min} caracteres` });

const numeroNoNegativo = (campo) =>
  z
    .number({ error: `${campo} es obligatorio y debe ser un número` })
    .min(0, { error: `${campo} no puede ser negativo` });

const booleanoDeQuery = z
  .enum(["true", "false"], { error: "Debe ser true o false" })
  .transform((valor) => valor === "true");

// ---------- params ----------
const idParamSchema = z.object({
  id: z
    .string({ error: "El ID es obligatorio" })
    .regex(/^[0-9a-fA-F]{24}$/, { error: "ID de MongoDB no válido" })
});

const slugParamSchema = z.object({
  slug: z
    .string({ error: "El slug es obligatorio" })
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Slug no válido" })
});

// ---------- body ----------
// strictObject: rechaza campos desconocidos (slug, deleted_at, isActive...),
// así nadie puede colarlos por POST/PUT.
const objectIdString = (campo) =>
  z
    .string({ error: `${campo} es obligatorio y debe ser un ID válido` })
    .regex(/^[0-9a-fA-F]{24}$/, { error: `${campo} no es un ID de MongoDB válido` });

// GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
const startPointSchema = z
  .object({
    type: z.literal("Point", { error: "startPoint.type debe ser 'Point'" }),
    coordinates: z
      .array(z.number({ error: "coordinates debe ser [lng, lat]" }), {
        error: "coordinates debe ser un array [lng, lat]"
      })
      .length(2, { error: "coordinates debe tener 2 valores [lng, lat]" })
  })
  .refine(
    (punto) =>
      punto.coordinates[0] >= -180 &&
      punto.coordinates[0] <= 180 &&
      punto.coordinates[1] >= -90 &&
      punto.coordinates[1] <= 90,
    { error: "Las coordenadas deben ser [lng, lat] dentro de rango" }
  )
  .optional();

// Una imagen: URL obligatoria (puede ir vacía) y texto alternativo opcional.
const imagenSchema = z.object({
  url: z.union([
    z.literal(""),
    z.url({ error: "La URL de la imagen no es válida" })
  ], { error: "La URL de la imagen es obligatoria" }),
  alt: z.string({ error: "alt debe ser texto" }).optional()
});

const createRutaSchema = z.strictObject({
  nombre: textoObligatorio("El nombre", 3),
  descripcion: textoObligatorio("La descripción"),
  dificultad: z.enum(DIFICULTADES, {
    error: `La dificultad debe ser: ${DIFICULTADES.join(", ")}`
  }),
  distanciaKm: numeroNoNegativo("La distancia"),
  desnivelM: numeroNoNegativo("El desnivel"),
  duracionHoras: numeroNoNegativo("La duración"),
  locationId: objectIdString("La ubicación"),
  categoryIds: z.array(objectIdString("La categoría")).optional(),
  circular: z.boolean({ error: "circular debe ser true o false" }).optional(),
  coverImage: z.object({
    url: z.union([z.literal(""), z.url({ error: "La URL de la imagen no es válida" })]).optional(),
    alt: z.string().optional()
  }).optional(),
  images: z.array(imagenSchema, { error: "images debe ser un array de imágenes" }).optional(),
  startPoint: startPointSchema,
  status: z.enum(STATUS, { error: `status debe ser: ${STATUS.join(", ")}` }).optional()
});

const updateRutaSchema = createRutaSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    error: "Debes enviar al menos un campo para actualizar"
  });

// ---------- query ----------
const listRutasQuerySchema = z.object({
  dificultad: z.enum(DIFICULTADES, { error: `dificultad debe ser: ${DIFICULTADES.join(", ")}` }).optional(),
  provincia: z.string().trim().min(1).max(60).optional(),
  circular: booleanoDeQuery.optional(),
  isActive: booleanoDeQuery.optional(),
  status: z.enum(STATUS, { error: `status debe ser: ${STATUS.join(", ")}` }).optional()
});

module.exports = {
  idParamSchema,
  slugParamSchema,
  createRutaSchema,
  updateRutaSchema,
  listRutasQuerySchema
};
