const { z } = require("zod");
const { slugParamSchema } = require("./shop.validator");

const SENTIMIENTOS = ["positivo", "neutro", "negativo"];
const ESTADOS_ADMIN = ["activos", "eliminados", "todos"];

const LIMITE_POR_DEFECTO = 10;
const LIMITE_MAXIMO = 50;

const objectId = (campo) =>
  z.string({ error: `${campo} es obligatorio` }).trim().regex(/^[a-f\d]{24}$/i, { error: `${campo} no es un ID válido` });

const entero = (campo, { min, max, defecto }) =>
  z.preprocess(
    (valor) => (valor === undefined || valor === "" ? defecto : valor),
    z.coerce
      .number({ error: `${campo} debe ser un número entero` })
      .int({ error: `${campo} debe ser un número entero` })
      .min(min, { error: `${campo} debe ser al menos ${min}` })
      .max(max, { error: `${campo} no puede superar ${max}` })
  );

const texto = z
  .string({ error: "El comentario es obligatorio" })
  .trim()
  .min(3, { error: "El comentario debe tener al menos 3 caracteres" })
  .max(1000, { error: "El comentario no puede superar los 1000 caracteres" });

const valoracion = z.coerce
  .number({ error: "La valoración es obligatoria" })
  .int({ error: "La valoración debe ser un número entero" })
  .min(1, { error: "La valoración mínima es 1" })
  .max(5, { error: "La valoración máxima es 5" });

const idParamSchema = z.object({ id: objectId("El comentario") });

const paginaQuerySchema = z.object({
  page: entero("page", { min: 1, max: 10000, defecto: 1 }),
  limit: entero("limit", { min: 1, max: LIMITE_MAXIMO, defecto: LIMITE_POR_DEFECTO })
});

const crearComentarioSchema = z.strictObject({ texto, valoracion });

const editarComentarioSchema = z
  .strictObject({ texto: texto.optional(), valoracion: valoracion.optional() })
  .refine((datos) => datos.texto !== undefined || datos.valoracion !== undefined, {
    error: "Indica el texto o la valoración a modificar"
  });

const vacioANull = (valor) => (valor === "" ? undefined : valor);

const listarAdminQuerySchema = paginaQuerySchema.extend({
  rutaId: z.preprocess(vacioANull, objectId("rutaId").optional()),
  userId: z.preprocess(vacioANull, objectId("userId").optional()),
  sentimiento: z.preprocess(vacioANull, z.enum([...SENTIMIENTOS, "pendiente"]).optional()),
  estado: z.preprocess(vacioANull, z.enum(ESTADOS_ADMIN).default("activos")),
  q: z.preprocess(vacioANull, z.string().trim().max(100).optional())
});

module.exports = {
  SENTIMIENTOS,
  ESTADOS_ADMIN,
  LIMITE_POR_DEFECTO,
  LIMITE_MAXIMO,
  slugParamSchema,
  idParamSchema,
  paginaQuerySchema,
  crearComentarioSchema,
  editarComentarioSchema,
  listarAdminQuerySchema
};
