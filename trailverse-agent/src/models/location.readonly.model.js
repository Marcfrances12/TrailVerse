const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    nombre: String,
    provincia: String,
    comunidad: String,
    pais: String,
    isActive: Boolean,
    deleted_at: Date
  },
  { collection: "locations", versionKey: false }
);

module.exports = mongoose.models.Location || mongoose.model("Location", locationSchema);
