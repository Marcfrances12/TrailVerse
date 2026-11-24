const mongoose = require("mongoose");

const SENTIMIENTOS = ["positivo", "neutro", "negativo"];

// Resultado del análisis de sentimiento con IA (script del agente). null = pendiente de analizar.
const sentimientoSchema = new mongoose.Schema(
  {
    etiqueta: { type: String, enum: SENTIMIENTOS, required: true },
    puntuacion: { type: Number, min: -1, max: 1, required: true },
    temas: { type: [String], default: [] },
    analizadoEn: { type: Date, required: true }
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario del comentario es obligatorio"]
    },
    rutaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ruta",
      required: [true, "La ruta del comentario es obligatoria"]
    },
    texto: {
      type: String,
      required: [true, "El comentario es obligatorio"],
      trim: true,
      minlength: [3, "El comentario debe tener al menos 3 caracteres"],
      maxlength: [1000, "El comentario no puede superar los 1000 caracteres"]
    },
    valoracion: {
      type: Number,
      required: [true, "La valoración es obligatoria"],
      min: [1, "La valoración mínima es 1"],
      max: [5, "La valoración máxima es 5"],
      validate: { validator: Number.isInteger, message: "La valoración debe ser un número entero" }
    },
    sentimiento: { type: sentimientoSchema, default: null },
    deleted_at: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

// Una reseña activa por usuario y ruta. Las borradas no cuentan, así que se puede volver a opinar.
commentSchema.index(
  { userId: 1, rutaId: 1 },
  { unique: true, partialFilterExpression: { deleted_at: { $type: "null" } } }
);
commentSchema.index({ rutaId: 1, deleted_at: 1, created_at: -1 });
commentSchema.index({ deleted_at: 1, created_at: -1 });
commentSchema.index({ "sentimiento.etiqueta": 1 });

commentSchema.statics.SENTIMIENTOS = SENTIMIENTOS;

module.exports = mongoose.model("Comment", commentSchema);
