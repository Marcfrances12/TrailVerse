const express = require("express");
const controller = require("../controllers/rutas.controller");
const validate = require("../middlewares/validate.middleware");
const {
  idParamSchema,
  slugParamSchema,
  createRutaSchema,
  updateRutaSchema,
  listRutasQuerySchema
} = require("../validators/rutas.validator");

const router = express.Router();

router.get("/", validate({ query: listRutasQuerySchema }), controller.getAll);
router.get("/deleted", controller.getDeleted);
router.get("/slug/:slug", validate({ params: slugParamSchema }), controller.getBySlug);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", validate({ body: createRutaSchema }), controller.create);
router.put("/:id", validate({ params: idParamSchema, body: updateRutaSchema }),controller.update);
router.patch("/:id/activate", validate({ params: idParamSchema }), controller.activate);
router.patch("/:id/deactivate", validate({ params: idParamSchema }), controller.deactivate);
router.delete("/:id", validate({ params: idParamSchema }), controller.softDelete);

module.exports = router;
