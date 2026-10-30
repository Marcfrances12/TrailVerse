const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del rol es obligatorio"],
      unique: true,
      trim: true,
      uppercase: true,
      enum: ["ADMIN", "USER"]
    },
    permissions: {
      type: [String],
      default: []
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

module.exports = mongoose.model("Role", roleSchema);
