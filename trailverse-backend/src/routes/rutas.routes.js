const express = require("express");
const controller = require("../controllers/rutas.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");
const {
  idParamSchema,
  slugParamSchema,
  createRutaSchema,
  updateRutaSchema,
  listRutasQuerySchema
} = require("../validators/rutas.validator");

const router = express.Router();

router.get("/", optionalAuthenticate, validate({ query: listRutasQuerySchema }), controller.getAll);
router.get("/deleted", authenticate, requireAdmin, controller.getDeleted);
router.get("/slug/:slug", optionalAuthenticate, validate({ params: slugParamSchema }), controller.getBySlug);
router.get("/:id", optionalAuthenticate, validate({ params: idParamSchema }), controller.getById);
router.use(authenticate, requireAdmin);
router.post("/", validate({ body: createRutaSchema }), controller.create);
router.put("/:id", validate({ params: idParamSchema, body: updateRutaSchema }),controller.update);
router.patch("/:id/activate", validate({ params: idParamSchema }), controller.activate);
router.patch("/:id/deactivate", validate({ params: idParamSchema }), controller.deactivate);
router.delete("/:id", validate({ params: idParamSchema }), controller.softDelete);
router.patch("/:id/restore", validate({ params: idParamSchema }), controller.restore);
router.delete("/:id/permanent", validate({ params: idParamSchema }), controller.hardDelete);

module.exports = router;
