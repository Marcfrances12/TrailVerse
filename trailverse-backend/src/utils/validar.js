const AppError = require("./AppError");

const formatearIssues = (origen, issues) =>
  issues.map((issue) => ({
    origen,
    campo: issue.path.join(".") || origen,
    mensaje: issue.message
  }));


const validarConZod = (schema, datos, origen = "body") => {
  const resultado = schema.safeParse(datos);

  if (!resultado.success) {
    throw new AppError(
      "Error de validación",
      400,
      formatearIssues(origen, resultado.error.issues)
    );
  }

  return resultado.data;
};

module.exports = { validarConZod, formatearIssues };
