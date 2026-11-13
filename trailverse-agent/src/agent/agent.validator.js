const { z } = require("zod");

const MAX_MENSAJE = 500;
const MAX_HISTORIAL = 10;
const MAX_CONTENIDO_HISTORIAL = 2000;

const mensajeHistorialSchema = z.strictObject({
  role: z.enum(["user", "assistant"], { error: "role debe ser user o assistant" }),
  content: z
    .string({ error: "content es obligatorio y debe ser texto" })
    .trim()
    .min(1, { error: "content no puede estar vacío" })
    .max(MAX_CONTENIDO_HISTORIAL, { error: `content no puede superar ${MAX_CONTENIDO_HISTORIAL} caracteres` })
});

const chatBodySchema = z.strictObject({
  message: z
    .string({ error: "message es obligatorio y debe ser texto" })
    .trim()
    .min(1, { error: "message no puede estar vacío" })
    .max(MAX_MENSAJE, { error: `message no puede superar ${MAX_MENSAJE} caracteres` }),
  history: z
    .array(mensajeHistorialSchema, { error: "history debe ser un array" })
    .max(MAX_HISTORIAL, { error: `history admite como máximo ${MAX_HISTORIAL} mensajes` })
    .default([]),
  routeId: z
    .string({ error: "routeId debe ser texto" })
    .regex(/^[0-9a-fA-F]{24}$/, { error: "routeId no es un ID válido" })
    .optional()
});

module.exports = { chatBodySchema };
