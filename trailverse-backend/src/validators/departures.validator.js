const { z } = require("zod");

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido");

const priceSchema = z
  .object({
    amount: z.coerce.number().min(0, "El precio no puede ser negativo"),
    currency: z
      .string()
      .trim()
      .length(3, "La moneda debe tener 3 caracteres")
      .default("EUR")
      .transform((valor) => valor.toUpperCase())
  })
  .strict();

const createDepartureSchema = z
  .strictObject({
    rutaId: objectId,
    startDate: z.coerce.date({ error: "La fecha de inicio no es válida" }),
    endDate: z.coerce.date({ error: "La fecha de fin no es válida" }).nullable().optional(),
    meetingPoint: z
      .string()
      .trim()
      .min(3, "El punto de encuentro debe tener al menos 3 caracteres")
      .max(200),
    price: priceSchema,
    capacity: z.coerce.number().int().min(1, "La capacidad debe ser al menos 1"),
    stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
    status: z.enum(["open", "full", "cancelled"]).optional().default("open")
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    { message: "La fecha de fin debe ser posterior a la de inicio", path: ["endDate"] }
  );

const updateDepartureSchema = z
  .object({
    rutaId: objectId.optional(),
    startDate: z.coerce.date({ error: "La fecha de inicio no es válida" }).optional(),
    endDate: z.coerce.date({ error: "La fecha de fin no es válida" }).nullable().optional(),
    meetingPoint: z.string().trim().min(3).max(200).optional(),
    price: priceSchema.optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    status: z.enum(["open", "full", "cancelled"]).optional()
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Debes proporcionar al menos un campo para actualizar"
  );

const listDeparturesQuerySchema = z.object({
  rutaId: objectId.optional(),
  status: z.enum(["open", "full", "cancelled"]).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true"))
});

module.exports = {
  idParamSchema,
  createDepartureSchema,
  updateDepartureSchema,
  listDeparturesQuerySchema
};
