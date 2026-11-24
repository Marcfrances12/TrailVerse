const express = require("express");
const controller = require("../controllers/likes.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");
const { slugParamSchema } = require("../validators/likes.validator");

const router = express.Router();

router.get("/me", authenticate, controller.getMisLikes);
router.get("/rutas/:slug", optionalAuthenticate, validate({ params: slugParamSchema }), controller.getEstado);
router.post("/rutas/:slug", authenticate, validate({ params: slugParamSchema }), controller.darLike);
router.delete("/rutas/:slug", authenticate, validate({ params: slugParamSchema }), controller.quitarLike);

module.exports = router;
