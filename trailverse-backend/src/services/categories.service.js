const categoriesRepo = require("../repos/categories.repo");
const AppError = require("../utils/AppError");
const { generateSlug } = require("../utils/slug");
const { validarConZod } = require("../utils/validar");
const { idParamSchema, createCategorySchema, updateCategorySchema } = require("../validators/categories.validator");
const integrity = require("./integrity.service");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function construirSlugUnico(name, excludeId) {
  const base = generateSlug(name);
  let candidato = base;
  let contador = 2;
  while (await categoriesRepo.slugExists(candidato, excludeId)) {
    candidato = `${base}-${contador}`;
    contador += 1;
  }
  return candidato;
}

async function getCategories(query = {}) {
  const filtros = {};
  if (query.type) filtros.type = query.type;
  if (query.isActive !== undefined) filtros.isActive = query.isActive;
  return categoriesRepo.getAll(filtros);
}

async function getCategoriesEliminadas() {
  return categoriesRepo.getDeleted();
}

async function getCategoryById(id) {
  const idValido = await validarId(id);
  const category = await categoriesRepo.getById(idValido);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  return category;
}

async function createCategory(datos) {
  const datosValidos = validarConZod(createCategorySchema, datos, "body");
  await integrity.validarRelacionesCategoria(datosValidos);
  const slug = await construirSlugUnico(datosValidos.name);
  return categoriesRepo.create({ ...datosValidos, slug });
}

async function updateCategory(id, datos) {
  const idValido = await validarId(id);
  const datosValidos = validarConZod(updateCategorySchema, datos, "body");
  const actual = await categoriesRepo.getById(idValido);
  if (!actual) throw AppError.notFound("Categoría no encontrada");
  await integrity.validarRelacionesCategoria(datosValidos, idValido);

  const updateData = { ...datosValidos };
  if (datosValidos.name && datosValidos.name !== actual.name) {
    updateData.slug = await construirSlugUnico(datosValidos.name, idValido);
  }
  const category = await categoriesRepo.update(idValido, updateData);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  return category;
}

async function activateCategory(id) {
  const idValido = await validarId(id);
  const actual = await categoriesRepo.getById(idValido);
  if (!actual) throw AppError.notFound("Categoría no encontrada");
  await integrity.validarRelacionesCategoria({ parentId: actual.parentId }, idValido);
  const category = await categoriesRepo.setActive(idValido, true);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  return category;
}

async function deactivateCategory(id) {
  const idValido = await validarId(id);
  const category = await categoriesRepo.setActive(idValido, false);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  await integrity.inactivarDependientes("category", idValido);
  return category;
}

async function deleteCategory(id) {
  const idValido = await validarId(id);
  const category = await categoriesRepo.softDelete(idValido);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  await integrity.inactivarDependientes("category", idValido);
  return category;
}

async function restoreCategory(id) {
  const idValido = await validarId(id);
  const actual = await categoriesRepo.getAnyById(idValido);
  if (!actual || actual.deleted_at == null) throw AppError.notFound("Categoría no encontrada en la papelera");
  await integrity.validarRelacionesCategoria({ parentId: actual.parentId }, idValido);
  const category = await categoriesRepo.restore(idValido);
  if (!category) throw AppError.notFound("Categoría no encontrada en la papelera");
  return category;
}

async function hardDeleteCategory(id) {
  const idValido = await validarId(id);
  await integrity.comprobarBorradoDefinitivo("category", idValido);
  const category = await categoriesRepo.hardDelete(idValido);
  if (!category) throw AppError.notFound("Categoría no encontrada");
  return category;
}

module.exports = {
  getCategories,
  getCategoriesEliminadas,
  getCategoryById,
  createCategory,
  updateCategory,
  activateCategory,
  deactivateCategory,
  deleteCategory,
  restoreCategory,
  hardDeleteCategory
};
