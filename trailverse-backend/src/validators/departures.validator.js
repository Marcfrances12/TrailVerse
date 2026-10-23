const { z } = require("zod");

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido");

const numeroCoercible = z.preprocess(
  (valor) => (valor === null || (typeof valor === "string" && valor.trim() === "") ? undefined : valor),
  z.coerce.number().finite()
);

const fechaCoercible = z.preprocess(
  (valor) => (valor === null || valor === "" ? undefined : valor),
  z.coerce.date({ error: "La fecha no es válida" })
);

const priceSchema = z
  .strictObject({
    amount: numeroCoercible.pipe(z.number().min(0, "El precio no puede ser negativo")),
    currency: z
      .string()
      .trim()
      .length(3, "La moneda debe tener 3 caracteres")
      .default("EUR")
      .transform((valor) => valor.toUpperCase())
      .pipe(z.enum(["EUR", "USD", "GBP"], { error: "La moneda debe ser EUR, USD o GBP" }))
  });

const priceUpdateSchema = z
  .strictObject({
    amount: numeroCoercible.pipe(z.number().min(0, "El precio no puede ser negativo")).optional(),
    currency: z
      .string()
      .trim()
      .length(3, "La moneda debe tener 3 caracteres")
      .transform((valor) => valor.toUpperCase())
      .pipe(z.enum(["EUR", "USD", "GBP"], { error: "La moneda debe ser EUR, USD o GBP" }))
      .optional()
  })
  .refine((price) => Object.keys(price).length > 0, "Debes indicar amount o currency");

const skuSchema = z.string().regex(
  /^[A-Z0-9]{2,6}-[A-Z]{3}-\d+(?:,\d+)?(?:-\d{3,})?$/,
  "El SKU de la salida no tiene un formato válido"
);

const createDepartureSchema = z
  .strictObject({
    rutaId: objectId,
    startDate: fechaCoercible,
    endDate: fechaCoercible.nullable().optional(),
    meetingPoint: z
      .string()
      .trim()
      .min(3, "El punto de encuentro debe tener al menos 3 caracteres")
      .max(200),
    price: priceSchema,
    capacity: numeroCoercible.pipe(z.number().int().min(1, "La capacidad debe ser al menos 1")),
    stock: numeroCoercible.pipe(z.number().int().min(0, "El stock no puede ser negativo")),
    status: z.enum(["open", "full", "cancelled"]).optional().default("open")
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    { message: "La fecha de fin debe ser posterior a la de inicio", path: ["endDate"] }
  )
  .refine(
    (data) => data.stock <= data.capacity,
    { message: "El stock no puede superar la capacidad", path: ["stock"] }
  );

const updateDepartureSchema = z
  .strictObject({
    rutaId: objectId.optional(),
    startDate: fechaCoercible.optional(),
    endDate: fechaCoercible.nullable().optional(),
    meetingPoint: z.string().trim().min(3).max(200).optional(),
    price: priceUpdateSchema.optional(),
    capacity: numeroCoercible.pipe(z.number().int().min(1)).optional(),
    stock: numeroCoercible.pipe(z.number().int().min(0)).optional(),
    status: z.enum(["open", "full", "cancelled"]).optional()
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Debes proporcionar al menos un campo para actualizar"
  )
  .refine(
    (data) => data.stock === undefined || data.capacity === undefined || data.stock <= data.capacity,
    { message: "El stock no puede superar la capacidad", path: ["stock"] }
  )
  .refine(
    (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
    { message: "La fecha de fin debe ser posterior a la de inicio", path: ["endDate"] }
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
  skuSchema,
  createDepartureSchema,
  updateDepartureSchema,
  listDeparturesQuerySchema
};
