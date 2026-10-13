const slugify = require("slugify");

const generateSlug = (texto) => {
  const slug = slugify(String(texto), {
    lower: true,
    strict: true,
    trim: true
  });

  return slug || "ruta";
};

module.exports = { generateSlug };
