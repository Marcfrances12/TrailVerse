const { z } = require("zod");

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const createCategorySchema = z.strictObject({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  type: z.enum(["ruta", "producto", "evento"], {
    errorMap: () => ({ message: "El tipo debe ser ruta, producto o evento" })
  }),
  parentId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
    .nullable()
    .optional()
});

const updateCategorySchema = createCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "Debes proporcionar al menos un campo para actualizar"
);

const listCategoriesQuerySchema = z.object({
  type: z.enum(["ruta", "producto", "evento"]).optional()
});

module.exports = {
  idParamSchema,
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema
};
