const mongoose = require("mongoose");

// Esquema mínimo y de solo lectura sobre la colección `rutas` del backend principal.
const faqSchema = new mongoose.Schema(
  {
    pregunta: String,
    respuesta: String,
    tags: { type: [String], default: [] }
  },
  { _id: false }
);

const rutaSchema = new mongoose.Schema(
  {
    nombre: String,
    descripcion: String,
    dificultad: String,
    distanciaKm: Number,
    desnivelM: Number,
    duracionHoras: Number,
    circular: Boolean,
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "Host" },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    startPoint: {
      type: { type: String },
      coordinates: [Number]
    },
    gpxUrl: String,
    slug: String,
    status: String,
    isActive: Boolean,
    deleted_at: Date,
    faqs: { type: [faqSchema], default: [] }
  },
  { collection: "rutas", versionKey: false }
);

module.exports = mongoose.models.Ruta || mongoose.model("Ruta", rutaSchema);
