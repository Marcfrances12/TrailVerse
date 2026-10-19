const express = require("express");
const controller = require("../controllers/locations.controller");
const { idParamSchema } = require("../validators/rutas.validator");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", controller.create);
router.put("/:id", validate({ params: idParamSchema }), controller.update);
router.delete("/:id", validate({ params: idParamSchema }), controller.remove);

module.exports = router;
