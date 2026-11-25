const mongoose = require("mongoose");

// Carrito de un usuario. Cada usuario tiene como máximo uno: se crea al añadir la primera salida
// y se conserva entre sesiones (vive en la base de datos, no en el navegador).
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario es obligatorio"],
      unique: true
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

module.exports = mongoose.model("Cart", cartSchema);
