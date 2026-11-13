const express = require("express");
const controller = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");

const router = express.Router();

router.get("/resumen", authenticate, requireAdmin, controller.getResumen);

module.exports = router;
