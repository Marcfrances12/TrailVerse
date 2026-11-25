const Cart = require("../models/cart.model");
const CartItem = require("../models/cart-item.model");
const Departure = require("../models/departure.model");

const CAMPOS_SALIDA = "rutaId startDate endDate meetingPoint price stock status isActive deleted_at";
const CAMPOS_RUTA = "nombre slug coverImage status isActive deleted_at";

const carritoDeUsuario = async (userId) => Cart.findOne({ userId }).lean();

// Devuelve el carrito del usuario y lo crea si aún no tiene. Con upsert, dos peticiones a la vez
// pueden intentar crearlo: el índice único frena la segunda, que entonces lee el ya creado.
const obtenerOCrearCarrito = async (userId) => {
  try {
    return await Cart.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true }
    ).lean();
  } catch (error) {
    if (error?.code === 11000) return carritoDeUsuario(userId);
    throw error;
  }
};

// Salida con su ruta, para comprobar si se puede reservar.
const salidaParaCarrito = async (departureId) =>
  Departure.findById(departureId)
    .select(CAMPOS_SALIDA)
    .populate({ path: "rutaId", select: CAMPOS_RUTA })
    .lean();

// Líneas del carrito con la salida y su ruta, en el orden en que se añadieron.
const itemsDeCarrito = async (cartId) =>
  CartItem.find({ cartId })
    .sort({ created_at: 1 })
    .populate({
      path: "departureId",
      select: CAMPOS_SALIDA,
      populate: { path: "rutaId", select: CAMPOS_RUTA }
    })
    .lean();

const buscarItem = async (cartId, departureId) => CartItem.findOne({ cartId, departureId }).lean();

// Suma plazas a una salida del carrito, o la inserta si no estaba (upsert + $inc).
const incrementarItem = async (cartId, departureId, cantidad) => {
  const operacion = () =>
    CartItem.findOneAndUpdate(
      { cartId, departureId },
      { $inc: { quantity: cantidad } },
      { upsert: true, new: true, runValidators: true }
    ).lean();

  try {
    return await operacion();
  } catch (error) {
    // Dos inserciones simultáneas de la misma salida: la segunda choca con el índice único.
    // Al reintentar, la línea ya existe y solo se incrementa.
    if (error?.code === 11000) return operacion();
    throw error;
  }
};

const fijarCantidad = async (cartId, departureId, quantity) =>
  CartItem.findOneAndUpdate(
    { cartId, departureId },
    { $set: { quantity } },
    { new: true, runValidators: true }
  ).lean();

const eliminarItem = async (cartId, departureId) => CartItem.findOneAndDelete({ cartId, departureId }).lean();

const eliminarItemsPorIds = async (ids) => {
  if (!ids.length) return;
  await CartItem.deleteMany({ _id: { $in: ids } });
};

const vaciar = async (cartId) => CartItem.deleteMany({ cartId });

// Al borrar definitivamente un usuario se borran su carrito y sus líneas.
const eliminarDeUsuario = async (userId) => {
  const carrito = await carritoDeUsuario(userId);
  if (!carrito) return;
  await CartItem.deleteMany({ cartId: carrito._id });
  await Cart.deleteOne({ _id: carrito._id });
};

// Al borrar definitivamente una salida desaparece de todos los carritos.
const eliminarDeDeparture = async (departureId) => CartItem.deleteMany({ departureId });

module.exports = {
  carritoDeUsuario,
  obtenerOCrearCarrito,
  salidaParaCarrito,
  itemsDeCarrito,
  buscarItem,
  incrementarItem,
  fijarCantidad,
  eliminarItem,
  eliminarItemsPorIds,
  vaciar,
  eliminarDeUsuario,
  eliminarDeDeparture
};
