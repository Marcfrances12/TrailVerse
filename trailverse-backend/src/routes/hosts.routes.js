const express = require("express");
const controller = require("../controllers/hosts.controller");
const {
  idParamSchema,
  createHostSchema,
  updateHostSchema,
  listHostsQuerySchema
} = require("../validators/hosts.validator");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.get("/", validate({ query: listHostsQuerySchema }), controller.getAll);
router.get("/deleted", controller.getDeleted);
router.get("/slug/:slug", controller.getBySlug);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", validate({ body: createHostSchema }), controller.create);
router.put("/:id", validate({ params: idParamSchema, body: updateHostSchema }), controller.update);
router.patch("/:id/activate", validate({ params: idParamSchema }), controller.activate);
router.patch("/:id/deactivate", validate({ params: idParamSchema }), controller.deactivate);
router.delete("/:id", validate({ params: idParamSchema }), controller.remove);
router.patch("/:id/restore", validate({ params: idParamSchema }), controller.restore);
router.delete("/:id/permanent", validate({ params: idParamSchema }), controller.hardDelete);

module.exports = router;
