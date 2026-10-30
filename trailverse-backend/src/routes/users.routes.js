const express = require("express");
const controller = require("../controllers/users.controller");
const {
  idParamSchema,
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema
} = require("../validators/users.validator");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/", validate({ query: listUsersQuerySchema }), controller.getAll);
router.get("/deleted", controller.getDeleted);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", validate({ body: createUserSchema }), controller.create);
router.put("/:id", validate({ params: idParamSchema, body: updateUserSchema }), controller.update);
router.patch("/:id/activate", validate({ params: idParamSchema }), controller.activate);
router.patch("/:id/deactivate", validate({ params: idParamSchema }), controller.deactivate);
router.delete("/:id", validate({ params: idParamSchema }), controller.remove);
router.patch("/:id/restore", validate({ params: idParamSchema }), controller.restore);
router.delete("/:id/permanent", validate({ params: idParamSchema }), controller.hardDelete);

module.exports = router;
