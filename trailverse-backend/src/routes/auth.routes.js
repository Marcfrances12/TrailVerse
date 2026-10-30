const express = require("express");
const controller = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { loginSchema } = require("../validators/auth.validator");

const router = express.Router();

router.post("/login", validate({ body: loginSchema }), controller.login);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);

module.exports = router;
