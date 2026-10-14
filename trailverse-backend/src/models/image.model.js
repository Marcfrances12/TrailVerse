const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "La URL es obligatoria"],
      trim: true
    },
    publicId: {
      type: String,
      default: ""
    },
    alt: {
      type: String,
      trim: true,
      default: ""
    },
    width: {
      type: Number,
      min: 0,
      default: null
    },
    height: {
      type: Number,
      min: 0,
      default: null
    },
    mimeType: {
      type: String,
      trim: true,
      default: ""
    },
    entityType: {
      type: String,
      required: [true, "El tipo de entidad es obligatorio"],
      enum: ["ruta", "host", "location", "evento"]
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "El ID de entidad es obligatorio"],
      refPath: "entityType"
    },
    position: {
      type: Number,
      default: 0
    },
    isCover: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

imageSchema.index({ entityType: 1, entityId: 1, position: 1 });

module.exports = mongoose.model("Image", imageSchema);
