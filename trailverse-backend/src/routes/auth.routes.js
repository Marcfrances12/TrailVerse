const express = require("express");
const controller = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { loginLimiter, registerLimiter } = require("../middlewares/rate-limit.middleware");
const { loginSchema, registerSchema } = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", registerLimiter, validate({ body: registerSchema }), controller.register);
router.post("/login", loginLimiter, validate({ body: loginSchema }), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);

module.exports = router;
