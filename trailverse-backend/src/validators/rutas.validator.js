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
const createRutaSchema = z.strictObject({
  nombre: textoObligatorio("El nombre", 3),
  descripcion: textoObligatorio("La descripción"),
  dificultad: z.enum(DIFICULTADES, {
    error: `La dificultad debe ser: ${DIFICULTADES.join(", ")}`
  }),
  distanciaKm: numeroNoNegativo("La distancia"),
  desnivelM: numeroNoNegativo("El desnivel"),
  duracionHoras: numeroNoNegativo("La duración"),
  ubicacion: textoObligatorio("La ubicación"),
  provincia: textoObligatorio("La provincia"),
  circular: z.boolean({ error: "circular debe ser true o false" }).optional(),
  imagen: z
    .union([z.literal(""), z.url({ error: "La imagen debe ser una URL válida" })])
    .optional(),
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
