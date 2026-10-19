const Image = require("../models/image.model");

// Imágenes de una entidad (ruta, host, location, evento).
const getByEntity = async (entityType, entityId) => {
  return Image.find({ entityType, entityId }).sort({ position: 1 });
};

const deleteByEntity = async (entityType, entityId) => {
  return Image.deleteMany({ entityType, entityId });
};

// Crea todas las imágenes de golpe. La primera (position 0) es la portada.
const createMany = async (entityType, entityId, imagenes = []) => {
  if (!Array.isArray(imagenes) || imagenes.length === 0) {
    return [];
  }

  const docs = imagenes.map((imagen, indice) => ({
    url: imagen.url,
    alt: imagen.alt || "",
    entityType,
    entityId,
    position: indice,
    isCover: indice === 0
  }));

  return Image.insertMany(docs);
};

module.exports = { getByEntity, deleteByEntity, createMany };
