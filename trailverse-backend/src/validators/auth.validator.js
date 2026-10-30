const { z } = require("zod");

const loginSchema = z.strictObject({
  identificador: z.string().trim().min(1, "Introduce tu email o usuario").max(254),
  password: z.string().min(1).max(128)
});

module.exports = { loginSchema };
