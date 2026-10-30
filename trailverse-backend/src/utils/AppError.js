class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Petición no válida", details = null) {
    return new AppError(message, 400, details);
  }

  static notFound(message = "Recurso no encontrado") {
    return new AppError(message, 404);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(message, 401);
  }

  static forbidden(message = "You do not have permission to access this resource") {
    return new AppError(message, 403);
  }

  static conflict(message = "Conflicto con el estado actual del recurso") {
    return new AppError(message, 409);
  }
}

module.exports = AppError;
