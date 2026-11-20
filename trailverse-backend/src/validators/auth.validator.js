const { z } = require("zod");
const { passwordSchema } = require("./users.validator");

const loginSchema = z.strictObject({
  identificador: z.string().trim().min(1, "Introduce tu email o usuario").max(254),
  password: z.string().min(1).max(128)
});

const registerSchema = z.strictObject({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .regex(/^\S+@\S+\.\S+$/, "El email no es válido"),
  password: passwordSchema
});

module.exports = { loginSchema, registerSchema };
