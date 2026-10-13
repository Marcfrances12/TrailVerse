const mongoose = require("mongoose");

const rutaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [3, "El nombre debe tener al menos 3 caracteres"]
    },
    descripcion: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true
    },
    dificultad: {
      type: String,
      required: [true, "La dificultad es obligatoria"],
      enum: ["facil", "media", "dificil"]
    },
    distanciaKm: {
      type: Number,
      required: [true, "La distancia es obligatoria"],
      min: [0, "La distancia no puede ser negativa"]
    },
    desnivelM: {
      type: Number,
      required: [true, "El desnivel es obligatorio"],
      min: [0, "El desnivel no puede ser negativo"]
    },
    duracionHoras: {
      type: Number,
      required: [true, "La duración es obligatoria"],
      min: [0, "La duración no puede ser negativa"]
    },
    ubicacion: {
      type: String,
      required: [true, "La ubicación es obligatoria"],
      trim: true
    },
    provincia: {
      type: String,
      required: [true, "La provincia es obligatoria"],
      trim: true
    },
    circular: {
      type: Boolean,
      default: false
    },
    imagen: {
      type: String,
      default: ""
    },
    slug: {
      type: String,
      required: [true, "El slug es obligatorio"],
      unique: true,
      trim: true,
      lowercase: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published"
    },
    deleted_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

module.exports = mongoose.model("Ruta", rutaSchema);
