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
    circular: {
      type: Boolean,
      default: false
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      default: null
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null
    },
    categoryIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Category",
      default: []
    },
    coverImage: {
      url: { type: String, default: "" },
      alt: { type: String, default: "" }
    },
    startPoint: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: "Las coordenadas deben ser [lng, lat] válidas"
        }
      }
    },
    gpxUrl: {
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

rutaSchema.index({ startPoint: "2dsphere" });

module.exports = mongoose.model("Ruta", rutaSchema);
