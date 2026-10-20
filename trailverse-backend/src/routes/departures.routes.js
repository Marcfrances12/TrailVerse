const express = require("express");
const controller = require("../controllers/departures.controller");
const {
  idParamSchema,
  createDepartureSchema,
  updateDepartureSchema,
  listDeparturesQuerySchema
} = require("../validators/departures.validator");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.get("/", validate({ query: listDeparturesQuerySchema }), controller.getAll);
router.get("/deleted", controller.getDeleted);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", validate({ body: createDepartureSchema }), controller.create);
router.put("/:id", validate({ params: idParamSchema, body: updateDepartureSchema }), controller.update);
router.patch("/:id/activate", validate({ params: idParamSchema }), controller.activate);
router.patch("/:id/deactivate", validate({ params: idParamSchema }), controller.deactivate);
router.delete("/:id", validate({ params: idParamSchema }), controller.remove);

module.exports = router;
