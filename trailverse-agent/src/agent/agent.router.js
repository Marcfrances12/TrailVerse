const express = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("./agent.controller");
const validate = require("../middlewares/validate.middleware");
const { chatBodySchema } = require("./agent.validator");
const { env } = require("../config/env");

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: env.AGENT_RATE_LIMIT_WINDOW_MS,
  limit: env.AGENT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Has enviado demasiadas consultas. Espera unos minutos antes de volver a intentarlo."
  }
});

const guiaLimiter = rateLimit({
  windowMs: env.GUIA_RATE_LIMIT_WINDOW_MS,
  limit: env.GUIA_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Has consultado demasiadas guías. Espera unos minutos antes de volver a intentarlo."
  }
});

const valoracionLimiter = rateLimit({
  windowMs: env.GUIA_RATE_LIMIT_WINDOW_MS,
  limit: env.GUIA_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Has consultado demasiadas valoraciones. Espera unos minutos antes de volver a intentarlo."
  }
});

router.post("/chat", chatLimiter, validate({ body: chatBodySchema }), controller.chat);
router.get("/rutas/:id/guia", guiaLimiter, controller.guia);
router.get("/rutas/:id/valoracion", valoracionLimiter, controller.valoracion);

module.exports = router;
