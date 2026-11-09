const { z } = require("zod");

const DIFICULTADES = ["facil", "media", "dificil"];
const MODOS_CATEGORIA = ["any", "all"];
const ORDENES = ["nombre", "created_at", "distanciaKm", "duracionHoras"];

const LIMITE_POR_DEFECTO = 12;
const LIMITE_MAXIMO = 50;
const LIMITE_HOME_POR_DEFECTO = 10;
const LIMITE_HOME_MAXIMO = 20;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugCampo = (campo) =>
  z
    .string({ error: `${campo} debe ser texto` })
    .trim()
    .toLowerCase()
    .regex(SLUG, { error: `${campo} no es un slug válido` });

const entero = (campo, { min, max, defecto }) =>
  z.preprocess(
    (valor) => (valor === undefined || valor === "" ? defecto : valor),
    z.coerce
      .number({ error: `${campo} debe ser un número entero` })
      .int({ error: `${campo} debe ser un número entero` })
      .min(min, { error: `${campo} debe ser al menos ${min}` })
      .max(max, { error: `${campo} no puede superar ${max}` })
  );

// categoria=a,b,c → ["a","b","c"]
const listaDeSlugs = (campo) =>
  z
    .string({ error: `${campo} debe ser texto` })
    .transform((valor) => valor.split(",").map((slug) => slug.trim().toLowerCase()).filter(Boolean))
    .pipe(
      z
        .array(slugCampo(campo))
        .min(1, { error: `${campo} no puede estar vacío` })
        .max(10, { error: `${campo} admite como máximo 10 valores` })
    );

const ordenSchema = z
  .string()
  .transform((valor) => {
    const descendente = valor.startsWith("-");
    const campo = descendente ? valor.slice(1) : valor;
    return { campo, descendente };
  })
  .pipe(
    z.object({
      campo: z.enum(ORDENES, { error: `sort debe ser: ${ORDENES.join(", ")} (con - para descendente)` }),
      descendente: z.boolean()
    })
  );

const listarRutasQuerySchema = z.object({
  q: z.string({ error: "q debe ser texto" }).trim().min(1).max(100).optional(),
  categoria: listaDeSlugs("categoria").optional(),
  categoryMode: z.enum(MODOS_CATEGORIA, { error: `categoryMode debe ser: ${MODOS_CATEGORIA.join(", ")}` }).default("any"),
  host: slugCampo("host").optional(),
  localizacion: slugCampo("localizacion").optional(),
  dificultad: z.enum(DIFICULTADES, { error: `dificultad debe ser: ${DIFICULTADES.join(", ")}` }).optional(),
  sort: ordenSchema.default({ campo: "created_at", descendente: true }),
  page: entero("page", { min: 1, max: 100000, defecto: 1 }),
  limit: entero("limit", { min: 1, max: LIMITE_MAXIMO, defecto: LIMITE_POR_DEFECTO })
});

const homeQuerySchema = z.object({
  limit: entero("limit", { min: 1, max: LIMITE_HOME_MAXIMO, defecto: LIMITE_HOME_POR_DEFECTO })
});

const slugParamSchema = z.object({
  slug: z
    .string({ error: "El slug es obligatorio" })
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Slug no válido" })
});

module.exports = {
  DIFICULTADES,
  MODOS_CATEGORIA,
  ORDENES,
  LIMITE_POR_DEFECTO,
  LIMITE_MAXIMO,
  LIMITE_HOME_POR_DEFECTO,
  listarRutasQuerySchema,
  homeQuerySchema,
  slugParamSchema
};
