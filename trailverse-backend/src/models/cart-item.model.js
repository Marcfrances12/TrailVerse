const mongoose = require("mongoose");

// Línea del carrito: una salida (departure) y cuántas plazas se quieren.
// El precio no se guarda: se lee siempre de la salida para que el total esté al día.
const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: [true, "El carrito es obligatorio"]
    },
    departureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Departure",
      required: [true, "La salida es obligatoria"],
      index: true
    },
    quantity: {
      type: Number,
      required: [true, "La cantidad es obligatoria"],
      min: [1, "La cantidad debe ser al menos 1"],
      validate: { validator: Number.isInteger, message: "La cantidad debe ser un número entero" }
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

// Una salida aparece una sola vez en cada carrito: si se vuelve a añadir, se suma la cantidad.
// La base de datos lo garantiza aunque lleguen dos peticiones a la vez.
cartItemSchema.index({ cartId: 1, departureId: 1 }, { unique: true });

module.exports = mongoose.model("CartItem", cartItemSchema);
