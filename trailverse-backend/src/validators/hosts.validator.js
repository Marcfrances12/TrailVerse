const { z } = require("zod");

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const slugParamSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug no válido")
});

const createHostSchema = z.strictObject({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  bio: z.string().trim().max(500).optional().default(""),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^\S+@\S+\.\S+$/, "El email no es válido"),
  phone: z.string().trim().max(30).optional().default(""),
  userId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
    .nullable()
    .optional()
});

const updateHostSchema = createHostSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "Debes proporcionar al menos un campo para actualizar"
);

const listHostsQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true"))
});

module.exports = {
  idParamSchema,
  slugParamSchema,
  createHostSchema,
  updateHostSchema,
  listHostsQuerySchema
};
