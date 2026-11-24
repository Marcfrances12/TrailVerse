const commentsRepo = require("../repos/comments.repo");
const shopRepo = require("../repos/shop.repo");
const AppError = require("../utils/AppError");
const { isOwnerOrAdmin } = require("../utils/authorization");
const { validarConZod } = require("../utils/validar");
const {
  slugParamSchema,
  idParamSchema,
  paginaQuerySchema,
  crearComentarioSchema,
  editarComentarioSchema,
  listarAdminQuerySchema
} = require("../validators/comments.validator");

const MENSAJE_DUPLICADO = "Ya has comentado esta ruta. Puedes editar tu comentario";
const MENSAJE_NO_ENCONTRADO = "Comentario no encontrado";
const MENSAJE_PROHIBIDO = "Solo puedes modificar o borrar tus propios comentarios";

// Umbrales del dashboard: una ruta se marca en alerta con suficientes opiniones negativas.
const MIN_ANALIZADOS_ALERTA = 3;
const PORCENTAJE_NEGATIVO_ALERTA = 40;
const MEDIA_ALERTA = 2.5;
const MAX_TEMAS = 5;

const idString = (valor) => (valor == null ? null : String(valor._id ?? valor));

// Solo se comenta en rutas publicadas, activas y no borradas.
async function rutaVisible(slug) {
  const slugValido = validarConZod(slugParamSchema, { slug }, "params").slug;
  const ruta = await shopRepo.idDeRutaVisible(slugValido);
  if (!ruta) throw AppError.notFound("Ruta no encontrada");
  return ruta;
}

function validarId(id) {
  return validarConZod(idParamSchema, { id }, "params").id;
}

function autorDe(usuario) {
  if (!usuario || typeof usuario !== "object") return { _id: null, nombre: "Usuario eliminado", avatarUrl: null };
  return {
    _id: idString(usuario),
    nombre: usuario.profile?.name || usuario.username || "Usuario",
    avatarUrl: usuario.profile?.avatarUrl || null
  };
}

function editado(comentario) {
  const creado = new Date(comentario.created_at).getTime();
  const actualizado = new Date(comentario.updated_at).getTime();
  return actualizado - creado > 1000;
}

// Forma pública: sin datos internos (sentimiento, quién borró, email...).
function presentarPublico(comentario, actor) {
  const autor = autorDe(comentario.userId);
  return {
    _id: idString(comentario),
    texto: comentario.texto,
    valoracion: comentario.valoracion,
    created_at: comentario.created_at,
    updated_at: comentario.updated_at,
    editado: editado(comentario),
    autor,
    esMio: Boolean(actor) && autor._id !== null && autor._id === idString(actor.id)
  };
}

function presentarAdmin(comentario) {
  const ruta = comentario.rutaId && typeof comentario.rutaId === "object" && comentario.rutaId.nombre
    ? { _id: idString(comentario.rutaId), nombre: comentario.rutaId.nombre, slug: comentario.rutaId.slug }
    : { _id: idString(comentario.rutaId), nombre: "Ruta eliminada", slug: null };

  return {
    ...presentarPublico(comentario, null),
    ruta,
    sentimiento: comentario.sentimiento ?? null,
    deleted_at: comentario.deleted_at ?? null,
    deletedBy: idString(comentario.deletedBy)
  };
}

async function listarDeRuta(slug, query = {}, actor = null) {
  const ruta = await rutaVisible(slug);
  const { page, limit } = validarConZod(paginaQuerySchema, query, "query");

  const [{ items, total }, estadisticas] = await Promise.all([
    commentsRepo.listarDeRuta(ruta._id, { page, limit }),
    commentsRepo.estadisticasDeRuta(ruta._id)
  ]);

  const yaComentado = actor ? await commentsRepo.existeDeUsuario(actor.id, ruta._id) : false;

  return {
    data: items.map((comentario) => presentarPublico(comentario, actor)),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    estadisticas,
    yaComentado
  };
}

async function crear(slug, body, actor) {
  const ruta = await rutaVisible(slug);
  const datos = validarConZod(crearComentarioSchema, body);

  if (await commentsRepo.existeDeUsuario(actor.id, ruta._id)) throw AppError.conflict(MENSAJE_DUPLICADO);

  let creado;
  try {
    creado = await commentsRepo.crear({ ...datos, userId: actor.id, rutaId: ruta._id });
  } catch (error) {
    // Dos envíos simultáneos pueden pasar la comprobación: el índice único responde igual.
    if (error?.code === 11000) throw AppError.conflict(MENSAJE_DUPLICADO);
    throw error;
  }

  const comentario = await commentsRepo.getConAutor(creado._id);
  return presentarPublico(comentario, actor);
}

// Busca el comentario activo y comprueba que el actor pueda tocarlo.
async function comentarioAutorizado(id, actor, { soloAutor }) {
  const idValido = validarId(id);
  const comentario = await commentsRepo.getActivoById(idValido);
  if (!comentario) throw AppError.notFound(MENSAJE_NO_ENCONTRADO);

  const permitido = soloAutor
    ? idString(comentario.userId) === idString(actor.id)
    : isOwnerOrAdmin(actor, comentario);

  if (!permitido) throw AppError.forbidden(MENSAJE_PROHIBIDO);
  return comentario;
}

// Editar: solo el autor. El admin modera borrando, no reescribe opiniones ajenas.
async function editar(id, body, actor) {
  const comentario = await comentarioAutorizado(id, actor, { soloAutor: true });
  const cambios = validarConZod(editarComentarioSchema, body);

  const actualizado = await commentsRepo.actualizar(comentario._id, cambios);
  if (!actualizado) throw AppError.notFound(MENSAJE_NO_ENCONTRADO);
  return presentarPublico(actualizado, actor);
}

// Borrar: el autor o un admin. Borrado lógico para poder auditar y restaurar.
async function eliminar(id, actor) {
  const comentario = await comentarioAutorizado(id, actor, { soloAutor: false });
  const borrado = await commentsRepo.softDelete(comentario._id, actor.id);
  if (!borrado) throw AppError.notFound(MENSAJE_NO_ENCONTRADO);
  return { _id: idString(borrado) };
}

// ---------- Admin ----------

async function listarAdmin(query = {}) {
  const opciones = validarConZod(listarAdminQuerySchema, query, "query");
  const { items, total } = await commentsRepo.listarAdmin(opciones);
  return {
    data: items.map(presentarAdmin),
    total,
    page: opciones.page,
    limit: opciones.limit,
    totalPages: Math.max(1, Math.ceil(total / opciones.limit))
  };
}

async function restaurar(id) {
  const idValido = validarId(id);
  const actual = await commentsRepo.getAnyById(idValido);
  if (!actual || actual.deleted_at == null) throw AppError.notFound("Comentario no encontrado en la papelera");

  try {
    const restaurado = await commentsRepo.restaurar(idValido);
    if (!restaurado) throw AppError.notFound("Comentario no encontrado en la papelera");
    return presentarAdmin(restaurado);
  } catch (error) {
    if (error?.code === 11000) {
      throw AppError.conflict("El usuario ya tiene otro comentario activo en esta ruta");
    }
    throw error;
  }
}

async function eliminarDefinitivo(id) {
  const idValido = validarId(id);
  const borrado = await commentsRepo.hardDelete(idValido);
  if (!borrado) throw AppError.notFound(MENSAJE_NO_ENCONTRADO);
  return { _id: idString(borrado) };
}

const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);
const redondear = (valor, decimales = 1) =>
  valor == null ? null : Math.round(valor * 10 ** decimales) / 10 ** decimales;

function temasFrecuentes(listas) {
  const cuenta = new Map();
  for (const lista of listas ?? []) {
    for (const tema of lista ?? []) {
      const clave = String(tema).trim().toLowerCase();
      if (clave) cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
    }
  }
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_TEMAS)
    .map(([tema, veces]) => ({ tema, veces }));
}

function resumirRuta(fila) {
  const analizados = fila.positivos + fila.neutros + fila.negativos;
  const porcentajeNegativo = porcentaje(fila.negativos, analizados);
  const media = redondear(fila.media);
  const motivosAlerta = [];

  if (analizados >= MIN_ANALIZADOS_ALERTA && porcentajeNegativo >= PORCENTAJE_NEGATIVO_ALERTA) {
    motivosAlerta.push(`${porcentajeNegativo}% de opiniones negativas`);
  }
  if (fila.total >= MIN_ANALIZADOS_ALERTA && media !== null && media <= MEDIA_ALERTA) {
    motivosAlerta.push(`valoración media de ${media}`);
  }

  return {
    rutaId: idString(fila.rutaId),
    nombre: fila.nombre,
    slug: fila.slug,
    total: fila.total,
    analizados,
    pendientes: fila.total - analizados,
    media,
    positivos: fila.positivos,
    neutros: fila.neutros,
    negativos: fila.negativos,
    porcentajes: {
      positivo: porcentaje(fila.positivos, analizados),
      neutro: porcentaje(fila.neutros, analizados),
      negativo: porcentajeNegativo
    },
    puntuacionMedia: redondear(fila.puntuacionMedia, 2),
    temas: temasFrecuentes(fila.temas),
    ultimoComentario: fila.ultimo,
    alerta: motivosAlerta.length > 0,
    motivosAlerta
  };
}

// Sentimiento de los clientes por ruta, a partir del análisis con IA de cada comentario.
async function sentimiento() {
  const filas = await commentsRepo.sentimientoPorRuta();
  const rutas = filas.map(resumirRuta).sort(
    (a, b) => Number(b.alerta) - Number(a.alerta) ||
      b.porcentajes.negativo - a.porcentajes.negativo ||
      b.total - a.total
  );

  const global = rutas.reduce(
    (acc, ruta) => {
      acc.total += ruta.total;
      acc.analizados += ruta.analizados;
      acc.positivos += ruta.positivos;
      acc.neutros += ruta.neutros;
      acc.negativos += ruta.negativos;
      return acc;
    },
    { total: 0, analizados: 0, positivos: 0, neutros: 0, negativos: 0 }
  );
  const sumaValoraciones = filas.reduce((suma, fila) => suma + (fila.media ?? 0) * fila.total, 0);

  return {
    global: {
      total: global.total,
      analizados: global.analizados,
      pendientes: global.total - global.analizados,
      media: global.total ? redondear(sumaValoraciones / global.total) : null,
      porcentajes: {
        positivo: porcentaje(global.positivos, global.analizados),
        neutro: porcentaje(global.neutros, global.analizados),
        negativo: porcentaje(global.negativos, global.analizados)
      },
      rutasEnAlerta: rutas.filter((ruta) => ruta.alerta).length,
      temas: temasFrecuentes(filas.flatMap((fila) => fila.temas))
    },
    rutas
  };
}

module.exports = {
  listarDeRuta,
  crear,
  editar,
  eliminar,
  listarAdmin,
  restaurar,
  eliminarDefinitivo,
  sentimiento,
  presentarPublico,
  MENSAJE_DUPLICADO,
  MENSAJE_PROHIBIDO
};
