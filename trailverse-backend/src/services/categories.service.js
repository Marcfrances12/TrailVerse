const categoriesRepo = require("../repos/categories.repo");
const AppError = require("../utils/AppError");
const { generateSlug } = require("../utils/slug");
const { idParamSchema } = require("../validators/rutas.validator");
const { validarConZod } = require("../utils/validar");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function construirSlugUnico(name) {
  const base = generateSlug(name);
  let candidato = base;
  let contador = 2;
  while (await categoriesRepo.slugExists(candidato)) {
    candidato = `${base}-${contador}`;
    contador += 1;
  }
  return candidato;
}

async function getCategories(query = {}) {
  const filtros = {};
  if (query.type) filtros.type = query.type;
  return categoriesRepo.getAll(filtros);
}

async function getCategoryById(id) {
  const idValido = await validarId(id);
  const category = await categoriesRepo.getById(idValido);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  return category;
}

async function createCategory(datos) {
  const slug = await construirSlugUnico(datos.name);
  return categoriesRepo.create({ ...datos, slug });
}

async function updateCategory(id, datos) {
  const idValido = await validarId(id);
  const category = await categoriesRepo.update(idValido, datos);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  return category;
}

async function deleteCategory(id) {
  const idValido = await validarId(id);
  const category = await categoriesRepo.deleteById(idValido);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  return category;
}

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
