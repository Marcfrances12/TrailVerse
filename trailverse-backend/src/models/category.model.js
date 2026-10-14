const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true
    },
    slug: {
      type: String,
      required: [true, "El slug es obligatorio"],
      trim: true,
      lowercase: true
    },
    type: {
      type: String,
      required: [true, "El tipo es obligatorio"],
      enum: ["ruta", "producto", "evento"]
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
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

categorySchema.index({ type: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
