const express = require("express");
const controller = require("../controllers/roles.controller");
const {
  idParamSchema,
  createRoleSchema,
  updateRoleSchema,
  listRolesQuerySchema
} = require("../validators/roles.validator");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.get("/", validate({ query: listRolesQuerySchema }), controller.getAll);
router.get("/deleted", controller.getDeleted);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", validate({ body: createRoleSchema }), controller.create);
router.put("/:id", validate({ params: idParamSchema, body: updateRoleSchema }), controller.update);
router.patch("/:id/activate", validate({ params: idParamSchema }), controller.activate);
router.patch("/:id/deactivate", validate({ params: idParamSchema }), controller.deactivate);
router.delete("/:id", validate({ params: idParamSchema }), controller.remove);
router.patch("/:id/restore", validate({ params: idParamSchema }), controller.restore);
router.delete("/:id/permanent", validate({ params: idParamSchema }), controller.hardDelete);

module.exports = router;
