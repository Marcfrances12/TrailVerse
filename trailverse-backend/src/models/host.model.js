const mongoose = require("mongoose");

const hostSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"]
    },
    slug: {
      type: String,
      required: [true, "El slug es obligatorio"],
      unique: true,
      trim: true,
      lowercase: true
    },
    bio: {
      type: String,
      trim: true,
      default: ""
    },
    contactEmail: {
      type: String,
      required: [true, "El email de contacto es obligatorio"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "El email no es válido"]
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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

module.exports = mongoose.model("Host", hostSchema);
