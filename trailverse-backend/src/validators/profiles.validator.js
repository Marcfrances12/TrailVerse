const { z } = require("zod");

const userIdParamSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const updateProfileSchema = z.strictObject({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100).optional(),
  avatarUrl: z.union([z.literal(""), z.url("La URL del avatar no es válida")]).optional(),
  bio: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional()
}).refine((data) => Object.keys(data).length > 0, "Debes enviar al menos un campo para actualizar");

const listProfilesQuerySchema = z.object({
  soloIncidencias: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true")
});

module.exports = { userIdParamSchema, updateProfileSchema, listProfilesQuerySchema };
