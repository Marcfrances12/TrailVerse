const express = require("express");
const controller = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");
const commentsController = require("../controllers/comments.controller");
const validate = require("../middlewares/validate.middleware");
const { idParamSchema, listarAdminQuerySchema } = require("../validators/comments.validator");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/resumen", controller.getResumen);

// Moderación de comentarios: el admin ve y borra los de todos los usuarios.
router.get("/comments", validate({ query: listarAdminQuerySchema }), commentsController.listarAdmin);
router.get("/comments/sentimiento", commentsController.sentimiento);
router.delete("/comments/:id", validate({ params: idParamSchema }), commentsController.eliminar);
router.patch("/comments/:id/restaurar", validate({ params: idParamSchema }), commentsController.restaurar);
router.delete("/comments/:id/definitivo", validate({ params: idParamSchema }), commentsController.eliminarDefinitivo);

module.exports = router;
