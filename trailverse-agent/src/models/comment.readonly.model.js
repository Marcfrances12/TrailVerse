const mongoose = require("mongoose");

// Esquema mínimo y de solo lectura sobre la colección `comments` del backend principal.
// El servicio HTTP solo lee; el sentimiento lo escribe el script analizar-sentimiento.
const commentSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    rutaId: mongoose.Schema.Types.ObjectId,
    texto: String,
    valoracion: Number,
    sentimiento: mongoose.Schema.Types.Mixed,
    deleted_at: Date,
    created_at: Date,
    updated_at: Date
  },
  { collection: "comments", versionKey: false }
);

module.exports = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
