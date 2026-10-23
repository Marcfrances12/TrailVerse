const rutasRepo = require("../repos/rutas.repo");
const imagenesService = require("./images.service");
const AppError = require("../utils/AppError");
const escapeRegex = require("../utils/escapeRegex");
const { generateSlug } = require("../utils/slug");
const { validarConZod } = require("../utils/validar");
const integrity = require("./integrity.service");
const departuresService = require("./departures.service");
const {
  idParamSchema,
  slugParamSchema,
  createRutaSchema,
  updateRutaSchema
} = require("../validators/rutas.validator");

// Adjunta las imágenes de la colección `images` a una ruta ya cargada.
async function conImagenes(ruta) {
  if (!ruta) {
    return ruta;
  }

  const imagenes = await imagenesService.obtenerImagenes(ruta._id);

  const rutaObj = ruta.toObject ? ruta.toObject() : ruta;
  return {
    ...rutaObj,
    images: imagenes,
    dependencyWarnings: integrity.avisosIntegridadRuta(rutaObj)
  };
}

function relacionesDe(ruta) {
  const datos = ruta.toObject ? ruta.toObject() : ruta;
  const id = (referencia) => referencia && typeof referencia === "object"
    ? referencia._id ?? referencia
    : referencia;
  return {
    locationId: id(datos.locationId),
    hostId: id(datos.hostId),
    categoryIds: Array.isArray(datos.categoryIds) ? datos.categoryIds.map(id) : []
  };
}

function conAvisos(ruta) {
  const datos = ruta.toObject ? ruta.toObject() : ruta;
  return { ...datos, dependencyWarnings: integrity.avisosIntegridadRuta(datos) };
}

// coverImage = primera imagen (para listados rápidos).
function portadaDe(images, actual) {
  if (Array.isArray(images) && images.length > 0) {
    return { url: images[0].url || "", alt: images[0].alt || "" };
  }

  return actual || { url: "", alt: "" };
}

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function validarSlug(slug) {
  return validarConZod(slugParamSchema, { slug }, "params").slug;
}

async function construirSlugUnico(nombre, excludeId) {
  const base = generateSlug(nombre);
  let candidato = base;
  let contador = 2;

  while (await rutasRepo.slugExists(candidato, excludeId)) {
    candidato = `${base}-${contador}`;
    contador += 1;
  }

  return candidato;
}

async function getRutas(query = {}) {
  const filtros = {};

  if (query.dificultad) {
    filtros.dificultad = query.dificultad;
  }

  if (query.provincia) {
    filtros.provincia = new RegExp(escapeRegex(query.provincia), "i");
  }

  if (query.circular !== undefined) {
    filtros.circular = query.circular;
  }

  if (query.isActive !== undefined) {
    filtros.isActive = query.isActive;
  }

  if (query.status) {
    filtros.status = query.status;
  }

  const rutas = await rutasRepo.getAll(filtros);
  return rutas.map(conAvisos);
}

async function getRutasEliminadas() {
  return rutasRepo.getDeleted();
}

async function getRutaById(id) {
  const idValido = await validarId(id);

  const ruta = await rutasRepo.getById(idValido);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return conImagenes(ruta);
}

async function getRutaBySlug(slug) {
  const slugValido = await validarSlug(slug);

  const ruta = await rutasRepo.getBySlug(slugValido);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return conImagenes(ruta);
}

async function createRuta(datos) {
  const datosValidos = validarConZod(createRutaSchema, datos, "body");
  await integrity.validarRelacionesRuta(datosValidos);
  const { images, ...resto } = datosValidos;

  const slug = await construirSlugUnico(datosValidos.nombre);

  const ruta = await rutasRepo.create({
    ...resto,
    coverImage: portadaDe(images, resto.coverImage),
    slug
  });

  if (Array.isArray(images)) {
    await imagenesService.guardarImagenes(ruta._id, images);
  }

  return conImagenes(ruta);
}

async function updateRuta(id, datos) {
  const idValido = await validarId(id);

  const datosValidos = validarConZod(updateRutaSchema, datos, "body");

  const rutaActual = await rutasRepo.getById(idValido);

  if (!rutaActual) {
    throw AppError.notFound("Ruta no encontrada");
  }

  const relacionesActualizadas = {};
  for (const campo of ["locationId", "hostId", "categoryIds"]) {
    if (Object.hasOwn(datosValidos, campo)) relacionesActualizadas[campo] = datosValidos[campo];
  }
  await integrity.validarRelacionesRuta(relacionesActualizadas);

  const { images, ...resto } = datosValidos;
  const nombreCambiado = datosValidos.nombre && datosValidos.nombre !== rutaActual.nombre;
  const locationActualId = String(rutaActual.locationId?._id ?? rutaActual.locationId);
  const skuAtributosCambiados =
    (datosValidos.dificultad !== undefined && datosValidos.dificultad !== rutaActual.dificultad) ||
    (datosValidos.distanciaKm !== undefined && datosValidos.distanciaKm !== rutaActual.distanciaKm) ||
    (datosValidos.locationId !== undefined && String(datosValidos.locationId) !== locationActualId);
  if (nombreCambiado) {
    resto.slug = await construirSlugUnico(datosValidos.nombre, idValido);
  }

  // Si se envían imágenes, la primera pasa a ser la portada.
  if (Array.isArray(images)) {
    resto.coverImage = portadaDe(images, rutaActual.coverImage);
  }

  const ruta = await rutasRepo.update(idValido, resto);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  if (skuAtributosCambiados) {
    await departuresService.regenerarSkusRuta(idValido);
  }

  if (Array.isArray(images)) {
    await imagenesService.guardarImagenes(idValido, images);
  }

  return conImagenes(ruta);
}

async function activateRuta(id) {
  const idValido = await validarId(id);
  const actual = await rutasRepo.getRelationsById(idValido);
  if (!actual) throw AppError.notFound("Ruta no encontrada");
  await integrity.validarRelacionesRuta(relacionesDe(actual));

  const ruta = await rutasRepo.setActive(idValido, true);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return conAvisos(ruta);
}

async function deactivateRuta(id) {
  const idValido = await validarId(id);
  await integrity.comprobarSinReferencias("ruta", idValido, "desactivar");

  const ruta = await rutasRepo.setActive(idValido, false);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return conAvisos(ruta);
}

async function deleteRuta(id) {
  const idValido = await validarId(id);
  await integrity.comprobarSinReferencias("ruta", idValido, "eliminar lógicamente");

  const ruta = await rutasRepo.softDelete(idValido);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return conAvisos(ruta);
}

async function restoreRuta(id) {
  const idValido = await validarId(id);
  const actual = await rutasRepo.getAnyById(idValido);
  if (!actual || actual.deleted_at == null) throw AppError.notFound("Ruta no encontrada en la papelera");
  await integrity.validarRelacionesRuta(relacionesDe(actual));

  const ruta = await rutasRepo.restore(idValido);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada en la papelera");
  }

  return conAvisos(ruta);
}

async function hardDeleteRuta(id) {
  const idValido = await validarId(id);
  await integrity.comprobarBorradoDefinitivo("ruta", idValido);

  const ruta = await rutasRepo.hardDelete(idValido);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  await imagenesService.eliminarImagenes(idValido);

  return ruta;
}

module.exports = {
  getRutas,
  getRutasEliminadas,
  getRutaById,
  getRutaBySlug,
  createRuta,
  updateRuta,
  activateRuta,
  deactivateRuta,
  deleteRuta,
  restoreRuta,
  hardDeleteRuta
};
