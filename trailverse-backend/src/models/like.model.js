const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rutaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ruta",
      required: true,
      index: true
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

// Un usuario solo puede dar like una vez a cada ruta. La base de datos lo garantiza
// aunque lleguen dos peticiones a la vez (doble clic, reintentos...).
likeSchema.index({ userId: 1, rutaId: 1 }, { unique: true });
likeSchema.index({ userId: 1, created_at: -1 });

module.exports = mongoose.model("Like", likeSchema);
