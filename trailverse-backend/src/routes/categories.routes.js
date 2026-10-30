const express = require("express");
const controller = require("../controllers/categories.controller");
const {
  idParamSchema,
  slugParamSchema,
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema
} = require("../validators/categories.validator");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");

const router = express.Router();

router.get("/", validate({ query: listCategoriesQuerySchema }), controller.getAll);
router.get("/deleted", authenticate, requireAdmin, controller.getDeleted);
router.get("/slug/:slug", validate({ params: slugParamSchema }), controller.getBySlug);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.use(authenticate, requireAdmin);
router.post("/", validate({ body: createCategorySchema }), controller.create);
router.put("/:id", validate({ params: idParamSchema, body: updateCategorySchema }), controller.update);
router.patch("/:id/activate", validate({ params: idParamSchema }), controller.activate);
router.patch("/:id/deactivate", validate({ params: idParamSchema }), controller.deactivate);
router.delete("/:id", validate({ params: idParamSchema }), controller.remove);
router.patch("/:id/restore", validate({ params: idParamSchema }), controller.restore);
router.delete("/:id/permanent", validate({ params: idParamSchema }), controller.hardDelete);

module.exports = router;
