// Los likes se dan sobre rutas públicas del shop, identificadas por su slug.
// Se reutiliza el mismo esquema que en el shop para que las reglas no se separen.
const { slugParamSchema } = require("./shop.validator");

module.exports = { slugParamSchema };
