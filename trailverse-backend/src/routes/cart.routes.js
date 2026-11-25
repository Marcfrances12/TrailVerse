const express = require("express");
const controller = require("../controllers/cart.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  departureParamSchema,
  anadirItemSchema,
  actualizarItemSchema
} = require("../validators/cart.validator");

const router = express.Router();

// El carrito siempre es el del usuario con sesión.
router.use(authenticate);

router.get("/", controller.getCarrito);
router.delete("/", controller.vaciar);
router.post("/items", validate({ body: anadirItemSchema }), controller.anadirItem);
router.patch(
  "/items/:departureId",
  validate({ params: departureParamSchema, body: actualizarItemSchema }),
  controller.actualizarItem
);
router.delete("/items/:departureId", validate({ params: departureParamSchema }), controller.quitarItem);

module.exports = router;
