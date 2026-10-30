const express = require("express");
const controller = require("../controllers/locations.controller");
const {
  idParamSchema,
  slugParamSchema,
  createLocationSchema,
  updateLocationSchema,
  listLocationsQuerySchema
} = require("../validators/locations.validator");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");

const router = express.Router();

router.get("/", validate({ query: listLocationsQuerySchema }), controller.getAll);
router.get("/deleted", authenticate, requireAdmin, controller.getDeleted);
router.get("/slug/:slug", validate({ params: slugParamSchema }), controller.getBySlug);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.use(authenticate, requireAdmin);
router.post("/", validate({ body: createLocationSchema }), controller.create);
router.put("/:id", validate({ params: idParamSchema, body: updateLocationSchema }), controller.update);
router.patch("/:id/activate", validate({ params: idParamSchema }), controller.activate);
router.patch("/:id/deactivate", validate({ params: idParamSchema }), controller.deactivate);
router.delete("/:id", validate({ params: idParamSchema }), controller.remove);
router.patch("/:id/restore", validate({ params: idParamSchema }), controller.restore);
router.delete("/:id/permanent", validate({ params: idParamSchema }), controller.hardDelete);

module.exports = router;
