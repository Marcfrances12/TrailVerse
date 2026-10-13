const AppError = require("../utils/AppError");
const { formatearIssues } = require("../utils/validar");

/**
 * Valida body, params y query con esquemas de Zod.
 *
 * Uso: validate({ params: idSchema, body: createSchema })
 *
 * - Si todo es correcto, sustituye req.body / req.params / req.query por los
 *   datos ya validados y limpios (trim, tipos, etc.).
 * - Si hay errores, los junta todos y llama a next(AppError 400), que acaba
 *   en el errorHandler global.
 */
const validate = (schemas = {}) => (req, res, next) => {
  const errores = [];
  const validados = {};

  for (const origen of ["params", "query", "body"]) {
    const schema = schemas[origen];
    if (!schema) continue;

    const resultado = schema.safeParse(req[origen] ?? {});

    if (resultado.success) {
      validados[origen] = resultado.data;
    } else {
      errores.push(...formatearIssues(origen, resultado.error.issues));
    }
  }

  if (errores.length > 0) {
    return next(new AppError("Error de validación", 400, errores));
  }

  if (validados.body) req.body = validados.body;
  if (validados.params) req.params = validados.params;

  // En Express 5 req.query es un getter de solo lectura: hay que redefinirlo
  if (validados.query) {
    Object.defineProperty(req, "query", {
      value: validados.query,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }

  next();
};

module.exports = validate;
