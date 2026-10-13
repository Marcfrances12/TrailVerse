const rutasRepo = require("../repos/rutas.repo");
const AppError = require("../utils/AppError");
const escapeRegex = require("../utils/escapeRegex");
const { generateSlug } = require("../utils/slug");
const { validarConZod } = require("../utils/validar");
const {
  idParamSchema,
  slugParamSchema,
  createRutaSchema,
  updateRutaSchema
} = require("../validators/rutas.validator");

async function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

async function validarSlug(slug) {
  return validarConZod(slugParamSchema, { slug }, "params").slug;
}

async function construirSlugUnico(nombre) {
  const base = generateSlug(nombre);
  let candidato = base;
  let contador = 2;

  while (await rutasRepo.slugExists(candidato)) {
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

  return rutasRepo.getAll(filtros);
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

  return ruta;
}

async function getRutaBySlug(slug) {
  const slugValido = await validarSlug(slug);

  const ruta = await rutasRepo.getBySlug(slugValido);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return ruta;
}

async function createRuta(datos) {
  
  const datosValidos = validarConZod(createRutaSchema, datos, "body");
  const slug = await construirSlugUnico(datosValidos.nombre);

  return rutasRepo.create({ ...datosValidos, slug });
}

async function updateRuta(id, datos) {
 
  const idValido = await validarId(id);

  const datosValidos = validarConZod(updateRutaSchema, datos, "body");

  const rutaActual = await rutasRepo.getById(idValido);

  if (!rutaActual) {
    throw AppError.notFound("Ruta no encontrada");
  }


  const ruta = await rutasRepo.update(idValido, datosValidos);

 
  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return ruta;
}

async function activateRuta(id) {
  const idValido = await validarId(id);

  const ruta = await rutasRepo.setActive(idValido, true);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return ruta;
}

async function deactivateRuta(id) {
  const idValido = await validarId(id);

  const ruta = await rutasRepo.setActive(idValido, false);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

  return ruta;
}

async function deleteRuta(id) {
  const idValido = await validarId(id);

  const ruta = await rutasRepo.softDelete(idValido);

  if (!ruta) {
    throw AppError.notFound("Ruta no encontrada");
  }

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
  deleteRuta
};
