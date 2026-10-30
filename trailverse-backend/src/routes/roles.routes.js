const express = require("express");
const controller = require("../controllers/roles.controller");
const {
  idParamSchema,
  listRolesQuerySchema
} = require("../validators/roles.validator");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.get("/", validate({ query: listRolesQuerySchema }), controller.getAll);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);

module.exports = router;
