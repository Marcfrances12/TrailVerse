const { z } = require("zod");

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const listRolesQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true"))
});

module.exports = { idParamSchema, listRolesQuerySchema };
