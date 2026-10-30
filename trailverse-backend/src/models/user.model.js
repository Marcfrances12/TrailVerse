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
