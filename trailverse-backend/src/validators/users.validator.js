const { z } = require("zod");

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const createUserSchema = z.strictObject({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^\S+@\S+\.\S+$/, "El email no es válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña no puede superar los 72 caracteres"),
  roleId: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const updateUserSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(100).optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^\S+@\S+\.\S+$/, "El email no es válido")
      .optional(),
    password: z.string().min(8).max(72).optional(),
    roleId: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido").optional()
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Debes proporcionar al menos un campo para actualizar"
  );

const listUsersQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true"))
});

module.exports = {
  idParamSchema,
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema
};
