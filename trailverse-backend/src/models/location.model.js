const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true
    },
    slug: {
      type: String,
      required: [true, "El slug es obligatorio"],
      unique: true,
      trim: true,
      lowercase: true
    },
    provincia: {
      type: String,
      required: [true, "La provincia es obligatoria"],
      trim: true
    },
    comunidad: {
      type: String,
      required: [true, "La comunidad autónoma es obligatoria"],
      trim: true
    },
    pais: {
      type: String,
      required: [true, "El país es obligatorio"],
      trim: true,
      default: "España"
    },
    geo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
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
    isActive: {
      type: Boolean,
      default: true
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

locationSchema.index({ geo: "2dsphere" });

module.exports = mongoose.model("Location", locationSchema);
