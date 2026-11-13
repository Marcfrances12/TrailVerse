const mongoose = require("mongoose");
const { env } = require("./env");

// El agente solo lee: no crea colecciones ni índices en la base compartida.
const connectDB = async () => {
  mongoose.set("autoIndex", false);
  mongoose.set("autoCreate", false);

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("MongoDB conectado (solo lectura)");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error.message);
    throw error;
  }
};

module.exports = connectDB;
