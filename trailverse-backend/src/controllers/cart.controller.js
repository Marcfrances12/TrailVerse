const cartService = require("../services/cart.service");

const getCarrito = async (req, res, next) => {
  try {
    const carrito = await cartService.getCarrito(req.user.id);
    res.status(200).json({ ok: true, data: carrito });
  } catch (error) { next(error); }
};

const anadirItem = async (req, res, next) => {
  try {
    const carrito = await cartService.anadirItem(req.user.id, req.body);
    res.status(200).json({ ok: true, message: "Salida añadida al carrito", data: carrito });
  } catch (error) { next(error); }
};

const actualizarItem = async (req, res, next) => {
  try {
    const carrito = await cartService.actualizarItem(req.user.id, req.params.departureId, req.body);
    res.status(200).json({ ok: true, message: "Cantidad actualizada", data: carrito });
  } catch (error) { next(error); }
};

const quitarItem = async (req, res, next) => {
  try {
    const carrito = await cartService.quitarItem(req.user.id, req.params.departureId);
    res.status(200).json({ ok: true, message: "Salida eliminada del carrito", data: carrito });
  } catch (error) { next(error); }
};

const vaciar = async (req, res, next) => {
  try {
    const carrito = await cartService.vaciar(req.user.id);
    res.status(200).json({ ok: true, message: "Carrito vaciado", data: carrito });
  } catch (error) { next(error); }
};

module.exports = { getCarrito, anadirItem, actualizarItem, quitarItem, vaciar };
