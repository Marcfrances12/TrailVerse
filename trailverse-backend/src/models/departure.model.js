const mongoose = require("mongoose");

const departureSchema = new mongoose.Schema(
  {
    rutaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ruta",
      required: [true, "La ruta es obligatoria"]
    },
    sku: {
      type: String,
      unique: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, "La fecha de inicio es obligatoria"]
    },
    endDate: {
      type: Date,
      default: null
    },
    meetingPoint: {
      type: String,
      required: [true, "El punto de encuentro es obligatorio"],
      trim: true
    },
    price: {
      amount: {
        type: Number,
        required: [true, "El precio es obligatorio"],
        min: [0, "El precio no puede ser negativo"]
      },
      currency: {
        type: String,
        default: "EUR",
        uppercase: true,
        trim: true
      }
    },
    capacity: {
      type: Number,
      required: [true, "La capacidad es obligatoria"],
      min: [1, "La capacidad debe ser al menos 1"]
    },
    stock: {
      type: Number,
      required: [true, "El stock es obligatorio"],
      min: [0, "El stock no puede ser negativo"]
    },
    status: {
      type: String,
      enum: ["open", "full", "cancelled"],
      default: "open"
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

departureSchema.index({ rutaId: 1, startDate: 1 });

module.exports = mongoose.model("Departure", departureSchema);
