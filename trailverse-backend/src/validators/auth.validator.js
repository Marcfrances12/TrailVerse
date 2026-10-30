const { z } = require("zod");

const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().regex(/^\S+@\S+\.\S+$/, "El email no es válido"),
  password: z.string().min(1).max(128)
});

module.exports = { loginSchema };
