const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario del perfil es obligatorio"],
      unique: true
    },
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [100, "El nombre no puede superar los 100 caracteres"]
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: ""
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "La biografía no puede superar los 500 caracteres"],
      default: ""
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, "El teléfono no puede superar los 30 caracteres"],
      default: ""
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

module.exports = mongoose.model("Profile", profileSchema);
