const mongoose = require("mongoose");
require("./profile.model");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "El email no es válido"]
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      match: [/^[a-z0-9_.-]{3,30}$/, "El usuario debe tener entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo"]
    },
    passwordHash: {
      type: String,
      required: [true, "El hash de contraseña es obligatorio"],
      select: false
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "El rol es obligatorio"]
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

userSchema.virtual("profile", {
  ref: "Profile",
  localField: "_id",
  foreignField: "userId",
  justOne: true
});

module.exports = mongoose.model("User", userSchema);
