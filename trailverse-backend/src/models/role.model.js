const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del rol es obligatorio"],
      unique: true,
      trim: true,
      lowercase: true
    },
    permissions: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

module.exports = mongoose.model("Role", roleSchema);
