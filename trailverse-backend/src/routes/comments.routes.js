const express = require("express");
const controller = require("../controllers/comments.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");
const { commentLimiter } = require("../middlewares/rate-limit.middleware");
const {
  slugParamSchema,
  idParamSchema,
  paginaQuerySchema,
  crearComentarioSchema,
  editarComentarioSchema
} = require("../validators/comments.validator");

const router = express.Router();

router.get(
  "/rutas/:slug",
  optionalAuthenticate,
  validate({ params: slugParamSchema, query: paginaQuerySchema }),
  controller.listarDeRuta
);
router.post(
  "/rutas/:slug",
  authenticate,
  commentLimiter,
  validate({ params: slugParamSchema, body: crearComentarioSchema }),
  controller.crear
);
router.patch(
  "/:id",
  authenticate,
  commentLimiter,
  validate({ params: idParamSchema, body: editarComentarioSchema }),
  controller.editar
);
// El servicio comprueba que sea el autor o un admin (403 si no).
router.delete("/:id", authenticate, validate({ params: idParamSchema }), controller.eliminar);

module.exports = router;
