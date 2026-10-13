// Escapa los caracteres especiales para usar un texto del usuario dentro de una RegExp
const escapeRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = escapeRegex;
