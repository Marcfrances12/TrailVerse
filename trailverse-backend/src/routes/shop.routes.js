const express = require("express");
const controller = require("../controllers/shop.controller");
const validate = require("../middlewares/validate.middleware");
const {
  listarRutasQuerySchema,
  homeQuerySchema,
  slugParamSchema
} = require("../validators/shop.validator");

const router = express.Router();

router.get("/home", validate({ query: homeQuerySchema }), controller.getHome);
router.get("/filtros", controller.getFiltros);
router.get("/rutas", validate({ query: listarRutasQuerySchema }), controller.getRutas);
router.get("/rutas/:slug", validate({ params: slugParamSchema }), controller.getRuta);
router.get("/rutas/:slug/departures", validate({ params: slugParamSchema }), controller.getSalidas);
router.get("/rutas/:slug/relacionadas", validate({ params: slugParamSchema }), controller.getRelacionadas);

module.exports = router;
