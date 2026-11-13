const validate = (schemas = {}) => (req, res, next) => {
  if (!schemas.body) return next();

  const resultado = schemas.body.safeParse(req.body ?? {});

  if (!resultado.success) {
    return res.status(400).json({
      ok: false,
      error: "Error de validación",
      details: resultado.error.issues.map((issue) => ({
        campo: issue.path.join("."),
        mensaje: issue.message
      }))
    });
  }

  req.body = resultado.data;
  next();
};

module.exports = validate;
