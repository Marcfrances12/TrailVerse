const express = require("express");
const controller = require("../controllers/profiles.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");
const { userIdParamSchema, updateProfileSchema, listProfilesQuerySchema } = require("../validators/profiles.validator");

const router = express.Router();

router.use(authenticate);
router.get("/me", controller.getMe);
router.patch("/me", validate({ body: updateProfileSchema }), controller.updateMe);
router.get("/", requireAdmin, validate({ query: listProfilesQuerySchema }), controller.getAll);
router.get("/:userId", requireAdmin, validate({ params: userIdParamSchema }), controller.getByUserId);
router.patch("/:userId", requireAdmin, validate({ params: userIdParamSchema, body: updateProfileSchema }), controller.updateByUserId);

module.exports = router;
