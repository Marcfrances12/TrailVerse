require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./src/config/database");
const Ruta = require("./src/models/ruta.model");
const { generateSlug } = require("./src/utils/slug");

const rutas = [
  {
    nombre: "Ruta del Peñón de Ifach",
    descripcion: "Ruta con vistas al Mediterráneo y al entorno natural de Calpe.",
    dificultad: "media",
    distanciaKm: 4.8,
    desnivelM: 330,
    duracionHoras: 2.5,
    ubicacion: "Calpe",
    provincia: "Alicante",
    circular: false,
    imagen: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"
  },
  {
    nombre: "Ruta del Montgó",
    descripcion: "Ascenso al Montgó con vistas panorámicas de la costa.",
    dificultad: "dificil",
    distanciaKm: 8.5,
    desnivelM: 750,
    duracionHoras: 4.5,
    ubicacion: "Dénia",
    provincia: "Alicante",
    circular: true,
    imagen: "https://images.unsplash.com/photo-1551632811-561732d1e306"
  },
  {
    nombre: "Ruta del Pou Clar",
    descripcion: "Paseo por un entorno natural con agua y zonas de descanso.",
    dificultad: "facil",
    distanciaKm: 3.2,
    desnivelM: 90,
    duracionHoras: 1.5,
    ubicacion: "Ontinyent",
    provincia: "Valencia",
    circular: true,
    imagen: "https://images.unsplash.com/photo-1500534623283-312aade485b7"
  },
  {
    nombre: "Ruta de la Font Roja",
    descripcion: "Recorrido por el parque natural de la Font Roja.",
    dificultad: "media",
    distanciaKm: 7.1,
    desnivelM: 410,
    duracionHoras: 3,
    ubicacion: "Alcoy",
    provincia: "Alicante",
    circular: true,
    imagen: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e"
  },
  {
    nombre: "Ruta de la Calderona",
    descripcion: "Ruta de montaña por la Sierra Calderona.",
    dificultad: "media",
    distanciaKm: 10.2,
    desnivelM: 520,
    duracionHoras: 4,
    ubicacion: "Serra",
    provincia: "Valencia",
    circular: true,
    imagen: "https://images.unsplash.com/photo-1464278533981-50106e6176b1"
  }
];

const seed = async () => {
  try {
    await connectDB();

    await Ruta.deleteMany({});

    // El slug lo genera el service en la API; aquí se genera igual
    const rutasConSlug = rutas.map((ruta) => ({
      ...ruta,
      slug: generateSlug(ruta.nombre)
    }));

    await Ruta.insertMany(rutasConSlug);

    // Asegura el índice único de slug (falla si quedaran documentos antiguos sin slug)
    await Ruta.syncIndexes();

    console.log(`Seed completado: ${rutas.length} rutas insertadas.`);
  } catch (error) {
    console.error("Error ejecutando seed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();
