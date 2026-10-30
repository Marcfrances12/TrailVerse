const AppError = require("../utils/AppError");

function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(AppError.unauthorized("Authentication required"));
  }
  if (req.user.role !== "ADMIN") {
    return next(AppError.forbidden("You do not have permission to access this resource"));
  }
  return next();
}

module.exports = { requireAdmin };
