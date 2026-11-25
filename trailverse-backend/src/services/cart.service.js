const cartRepo = require("../repos/cart.repo");
const shopRepo = require("../repos/shop.repo");
const AppError = require("../utils/AppError");
const { validarConZod } = require("../utils/validar");
const {
  departureParamSchema,
  anadirItemSchema,
  actualizarItemSchema
} = require("../validators/cart.validator");

// El carrito solo trabaja en euros.
const MONEDA = "EUR";

const MENSAJES = {
  salidaNoEncontrada: "Salida no encontrada",
  noEnCarrito: "Esta salida no está en tu carrito",
  noDisponible: "Esta salida ya no está disponible",
  noAbierta: "Esta salida no admite reservas",
  pasada: "Esta salida ya se ha realizado",
  sinPlazas: "No quedan plazas para esta salida",
  moneda: `Solo se pueden añadir al carrito salidas en ${MONEDA}`
};

const redondear = (importe) => Math.round(importe * 100) / 100;

const plazas = (n) => `${n} ${n === 1 ? "plaza" : "plazas"}`;

// Motivo por el que una salida no se puede reservar, o null si se puede.
function motivoNoDisponible(salida, ahora = new Date()) {
  const ruta = salida?.rutaId;
  if (
    !salida ||
    !salida.isActive ||
    salida.deleted_at ||
    !ruta ||
    typeof ruta !== "object" ||
    ruta.status !== "published" ||
    !ruta.isActive ||
    ruta.deleted_at
  ) return MENSAJES.noDisponible;
  if (salida.status !== "open") return MENSAJES.noAbierta;
  if (new Date(salida.startDate) < ahora) return MENSAJES.pasada;
  if (salida.price?.currency !== MONEDA) return MENSAJES.moneda;
  if (salida.stock <= 0) return MENSAJES.sinPlazas;
  return null;
}

// Comprueba que la salida existe y se puede reservar; si no, lanza el error correspondiente.
async function salidaReservable(departureId) {
  const salida = await cartRepo.salidaParaCarrito(departureId);
  if (!salida) throw AppError.notFound(MENSAJES.salidaNoEncontrada);

  const motivo = motivoNoDisponible(salida);
  if (motivo) throw AppError.conflict(motivo);
  return salida;
}

function exigirStock(salida, cantidad, enCarrito = 0) {
  if (cantidad <= salida.stock) return;

  const mensaje = enCarrito > 0
    ? `Solo quedan ${plazas(salida.stock)} para esta salida y ya tienes ${enCarrito} en el carrito`
    : `Solo quedan ${plazas(salida.stock)} para esta salida`;
  throw AppError.conflict(mensaje);
}

/**
 * Lógica de negocio del carrito: precio por línea, subtotal, total y total_items.
 * Las líneas no disponibles se devuelven marcadas pero no suman en los totales,
 * así el usuario ve qué ha dejado de estar disponible y puede quitarlo.
 */
function calcularCarrito(items, imagenes = []) {
  const portadas = new Map();
  for (const imagen of imagenes) {
    const clave = String(imagen.entityId);
    if (!portadas.has(clave)) portadas.set(clave, { url: imagen.url || "", alt: imagen.alt || "" });
  }

  const ahora = new Date();
  const lineas = items.map((item) => {
    const salida = item.departureId;
    const ruta = salida.rutaId && typeof salida.rutaId === "object" ? salida.rutaId : null;
    const motivo = motivoNoDisponible(salida, ahora);
    // Si el stock ha bajado por debajo de lo que había en el carrito, la línea deja de ser válida
    // hasta que el usuario reduzca la cantidad.
    const motivoFinal = motivo ?? (item.quantity > salida.stock ? `Solo quedan ${plazas(salida.stock)}` : null);
    const price = redondear(salida.price?.amount ?? 0);

    return {
      _id: String(item._id),
      departureId: String(salida._id),
      quantity: item.quantity,
      price,
      currency: MONEDA,
      subtotal: redondear(price * item.quantity),
      disponible: motivoFinal === null,
      motivo: motivoFinal,
      salida: {
        startDate: salida.startDate,
        endDate: salida.endDate ?? null,
        meetingPoint: salida.meetingPoint,
        stock: salida.stock
      },
      ruta: ruta
        ? {
            _id: String(ruta._id),
            nombre: ruta.nombre,
            slug: ruta.slug,
            coverImage: portadas.get(String(ruta._id)) ?? ruta.coverImage ?? { url: "", alt: "" }
          }
        : null
    };
  });

  const disponibles = lineas.filter((linea) => linea.disponible);

  return {
    items: lineas,
    total: redondear(disponibles.reduce((suma, linea) => suma + linea.subtotal, 0)),
    total_items: disponibles.reduce((suma, linea) => suma + linea.quantity, 0),
    currency: MONEDA
  };
}

const CARRITO_VACIO = Object.freeze({ items: [], total: 0, total_items: 0, currency: MONEDA });

async function getCarrito(userId) {
  const carrito = await cartRepo.carritoDeUsuario(userId);
  if (!carrito) return { ...CARRITO_VACIO, items: [] };

  const items = await cartRepo.itemsDeCarrito(carrito._id);

  // Líneas cuya salida ya no existe (borrado definitivo sin cascada): se limpian.
  const huerfanas = items.filter((item) => !item.departureId);
  if (huerfanas.length) await cartRepo.eliminarItemsPorIds(huerfanas.map((item) => item._id));
  const validas = items.filter((item) => item.departureId);

  const rutaIds = [
    ...new Set(
      validas
        .map((item) => item.departureId.rutaId?._id)
        .filter(Boolean)
        .map(String)
    )
  ];
  const imagenes = rutaIds.length ? await shopRepo.imagenesDeEntidades("ruta", rutaIds) : [];

  return calcularCarrito(validas, imagenes);
}

// Añade plazas de una salida. Si ya estaba en el carrito, se suma a la cantidad que había.
async function anadirItem(userId, datos) {
  const { departureId, quantity } = validarConZod(anadirItemSchema, datos, "body");
  const salida = await salidaReservable(departureId);

  const carrito = await cartRepo.obtenerOCrearCarrito(userId);
  const existente = await cartRepo.buscarItem(carrito._id, departureId);
  const enCarrito = existente?.quantity ?? 0;
  exigirStock(salida, enCarrito + quantity, enCarrito);

  await cartRepo.incrementarItem(carrito._id, departureId, quantity);
  return getCarrito(userId);
}

// Fija la cantidad de una salida que ya está en el carrito.
async function actualizarItem(userId, departureId, datos) {
  const params = validarConZod(departureParamSchema, { departureId }, "params");
  const { quantity } = validarConZod(actualizarItemSchema, datos, "body");

  const carrito = await cartRepo.carritoDeUsuario(userId);
  const existente = carrito ? await cartRepo.buscarItem(carrito._id, params.departureId) : null;
  if (!existente) throw AppError.notFound(MENSAJES.noEnCarrito);

  const salida = await salidaReservable(params.departureId);
  exigirStock(salida, quantity);

  await cartRepo.fijarCantidad(carrito._id, params.departureId, quantity);
  return getCarrito(userId);
}

async function quitarItem(userId, departureId) {
  const params = validarConZod(departureParamSchema, { departureId }, "params");

  const carrito = await cartRepo.carritoDeUsuario(userId);
  const eliminado = carrito ? await cartRepo.eliminarItem(carrito._id, params.departureId) : null;
  if (!eliminado) throw AppError.notFound(MENSAJES.noEnCarrito);

  return getCarrito(userId);
}

async function vaciar(userId) {
  const carrito = await cartRepo.carritoDeUsuario(userId);
  if (carrito) await cartRepo.vaciar(carrito._id);
  return { ...CARRITO_VACIO, items: [] };
}

module.exports = {
  getCarrito,
  anadirItem,
  actualizarItem,
  quitarItem,
  vaciar,
  calcularCarrito,
  motivoNoDisponible,
  MENSAJES,
  MONEDA
};
