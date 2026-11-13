const shopRepo = require("../repos/shop.repo");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const { DIFICULTADES, MODOS_CATEGORIA, ORDENES, PRECIO_MINIMO, PRECIO_MAXIMO, slugParamSchema } = require("../validators/shop.validator");

const LIMITE_RELACIONADAS = 6;

function validarSlug(slug) {
  return validarConZod(slugParamSchema, { slug }, "params").slug;
}


async function conImagen(entidades, tipo) {
  const ids = entidades.map((entidad) => entidad._id);
  if (ids.length === 0) return entidades;

  const imagenes = await shopRepo.imagenesDeEntidades(tipo, ids);
  const portadas = new Map();
  for (const imagen of imagenes) {
    const clave = String(imagen.entityId);
    if (!portadas.has(clave)) portadas.set(clave, { url: imagen.url, alt: imagen.alt || "" });
  }

  return entidades.map((entidad) => ({ ...entidad, imagen: portadas.get(String(entidad._id)) ?? null }));
}


function portadaDe(imagenes, coverImage) {
  const primera = imagenes[0];
  if (primera) return { url: primera.url || "", alt: primera.alt || "" };
  return coverImage || { url: "", alt: "" };
}

function agruparPorRuta(filas) {
  const mapa = new Map();
  for (const fila of filas) {
    const clave = String(fila.entityId ?? fila._id);
    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave).push(fila);
  }
  return mapa;
}


async function enriquecerRutas(items) {
  const ids = items.map((ruta) => ruta._id);
  const [imagenes, precios] = await Promise.all([
    ids.length ? shopRepo.imagenesDeRutas(ids) : [],
    ids.length ? shopRepo.preciosDesdeDeRutas(ids) : []
  ]);

  const imagenesPorRuta = agruparPorRuta(imagenes);
  const preciosPorRuta = new Map(precios.map((precio) => [String(precio._id), precio]));

  return items.map((ruta) => {
    const precio = preciosPorRuta.get(String(ruta._id));
    return {
      ...ruta,
      coverImage: portadaDe(imagenesPorRuta.get(String(ruta._id)) ?? [], ruta.coverImage),
      precioDesde: precio ? { amount: precio.amount, currency: precio.currency } : null
    };
  });
}

async function getRutas(query) {
  const { page, limit, sort, categoryMode, categoria, host, localizacion, precioMin, precioMax, ...criterios } = query;

  const porSlug = await shopRepo.idsDeSlugs({ categoria, host, localizacion });
  if (!porSlug) return { data: [], total: 0, page, limit, totalPages: 0 };

  const porPrecio = precioMin > PRECIO_MINIMO || precioMax < PRECIO_MAXIMO
    ? { rutaIds: await shopRepo.idsRutasPorPrecio({ min: precioMin, max: precioMax }) }
    : {};

  const { items, total } = await shopRepo.buscarRutas({
    criterios: { ...criterios, categoryMode, ...porSlug, ...porPrecio },
    sort,
    page,
    limit
  });

  const data = await enriquecerRutas(items);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

async function getHome({ limit }) {
  const [categories, hosts, locations] = await Promise.all([
    shopRepo.conteosHome("categories", limit),
    shopRepo.conteosHome("hosts", limit),
    shopRepo.conteosHome("locations", limit)
  ]);

  const [categoriesConImagen, locationsConImagen] = await Promise.all([
    conImagen(categories, "categoria"),
    conImagen(locations, "location")
  ]);

  return { categories: categoriesConImagen, hosts, locations: locationsConImagen };
}

async function getFiltros() {
  const [categories, hosts, locations] = await Promise.all([
    shopRepo.opcionesFiltro("categories"),
    shopRepo.opcionesFiltro("hosts"),
    shopRepo.opcionesFiltro("locations")
  ]);

  const [categoriesConImagen, locationsConImagen] = await Promise.all([
    conImagen(categories, "categoria"),
    conImagen(locations, "location")
  ]);

  return {
    dificultades: DIFICULTADES,
    categoryModes: MODOS_CATEGORIA,
    sort: ORDENES.flatMap((campo) => [campo, `-${campo}`]),
    categories: categoriesConImagen,
    hosts,
    locations: locationsConImagen
  };
}

async function getRuta(slug) {
  const slugValido = validarSlug(slug);
  const ruta = await shopRepo.buscarRutaVisiblePorSlug(slugValido);
  if (!ruta) throw AppError.notFound("Ruta no encontrada");

  const [imagenes, [localizacion], categorias] = await Promise.all([
    shopRepo.imagenesDeRutas([ruta._id]),
    ruta.locationId ? conImagen([ruta.locationId], "location") : [null],
    conImagen(ruta.categoryIds ?? [], "categoria")
  ]);

  return {
    ...ruta,
    locationId: localizacion ?? ruta.locationId ?? null,
    categoryIds: categorias,
    coverImage: portadaDe(imagenes, ruta.coverImage),
    images: imagenes.map(({ url, alt }) => ({ url, alt }))
  };
}

async function getSalidas(slug) {
  const slugValido = validarSlug(slug);
  const ruta = await shopRepo.idDeRutaVisible(slugValido);
  if (!ruta) throw AppError.notFound("Ruta no encontrada");

  return shopRepo.salidasPublicasDeRuta(ruta._id);
}

async function getRelacionadas(slug) {
  const slugValido = validarSlug(slug);
  const ruta = await shopRepo.idDeRutaVisible(slugValido);
  if (!ruta) throw AppError.notFound("Ruta no encontrada");

  const items = await shopRepo.rutasRelacionadas(ruta, LIMITE_RELACIONADAS);
  return enriquecerRutas(items);
}

module.exports = { getRutas, getHome, getFiltros, getRuta, getSalidas, getRelacionadas };
