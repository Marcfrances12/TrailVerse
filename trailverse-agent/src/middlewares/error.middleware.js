const notFound = (req, res) => {
  res.status(404).json({
    ok: false,
    error: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, error: "JSON no válido" });
  }

  const statusCode = error.statusCode || error.status || 500;

  if (statusCode >= 500) {
    console.error("[error]", error.message);
    return res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }

  res.status(statusCode).json({ ok: false, error: error.message });
};

module.exports = { notFound, errorHandler };
