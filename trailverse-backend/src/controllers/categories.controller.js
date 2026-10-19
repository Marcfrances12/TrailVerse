const categoriesService = require("../services/categories.service");

const getAll = async (req, res, next) => {
  try {
    const categories = await categoriesService.getCategories(req.query);
    res.status(200).json({ ok: true, total: categories.length, data: categories });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    res.status(200).json({ ok: true, data: category });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const category = await categoriesService.createCategory(req.body);
    res.status(201).json({ ok: true, message: "Categoría creada correctamente", data: category });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategory(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Categoría actualizada correctamente", data: category });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await categoriesService.deleteCategory(req.params.id);
    res.status(200).json({ ok: true, message: "Categoría eliminada correctamente" });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
