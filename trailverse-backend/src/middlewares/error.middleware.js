const mongoose = require("mongoose");
const { ZodError } = require("zod");

const notFound = (req, res) => {
  res.status(404).json({
    ok: false,
    error: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Error interno del servidor";
  let details = error.details || null;


  if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "JSON no válido";
  }

  // Zod lanzado fuera del middleware validate (por ejemplo desde un service)
  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Error de validación";
    details = error.issues.map((issue) => ({
      campo: issue.path.join("."),
      mensaje: issue.message
    }));
  }

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Error de validación";
    details = Object.values(error.errors).map((item) => item.message);
  }

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "ID de MongoDB no válido";
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "Ya existe un registro con ese valor";
  }

  // Solo se registran en consola los errores del servidor (los 4xx son del cliente)
  if (statusCode >= 500) {
    console.error(error);
    message = error.isOperational ? message : "Error interno del servidor";
  }

  res.status(statusCode).json({
    ok: false,
    error: message,
    ...(details && { details })
  });
};

module.exports = {
  notFound,
  errorHandler
};
