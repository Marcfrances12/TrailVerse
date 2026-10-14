require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./src/config/database");
const { generateSlug } = require("./src/utils/slug");

const Role = require("./src/models/role.model");
const User = require("./src/models/user.model");
const Host = require("./src/models/host.model");
const Location = require("./src/models/location.model");
const Category = require("./src/models/category.model");
const Image = require("./src/models/image.model");
const Ruta = require("./src/models/ruta.model");
const Departure = require("./src/models/departure.model");

const seed = async () => {
  try {
    await connectDB();

    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Host.deleteMany({}),
      Location.deleteMany({}),
      Category.deleteMany({}),
      Image.deleteMany({}),
      Ruta.deleteMany({}),
      Departure.deleteMany({})
    ]);

    const roles = await Role.insertMany([
      { name: "admin", permissions: ["all"] },
      { name: "organizer", permissions: ["manage_rutas", "manage_departures", "manage_hosts"] },
      { name: "user", permissions: ["read"] }
    ]);

    const users = await User.insertMany([
      { name: "Admin User", email: "admin@trailverse.com", passwordHash: "$2b$12$placeholderhashplaceholderhashplaceholderhashpla", roleId: roles[0]._id },
      { name: "María García", email: "maria@trailverse.com", passwordHash: "$2b$12$placeholderhashplaceholderhashplaceholderhashpla", roleId: roles[1]._id },
      { name: "Carlos Ruiz", email: "carlos@trailverse.com", passwordHash: "$2b$12$placeholderhashplaceholderhashplaceholderhashpla", roleId: roles[1]._id },
      { name: "Ana López", email: "ana@trailverse.com", passwordHash: "$2b$12$placeholderhashplaceholderhashplaceholderhashpla", roleId: roles[2]._id }
    ]);

    const locations = await Location.insertMany([
      { nombre: "Calpe", slug: "calpe", provincia: "Alicante", comunidad: "Comunidad Valenciana", pais: "España", geo: { type: "Point", coordinates: [0.0582, 38.6437] } },
      { nombre: "Dénia", slug: "denia", provincia: "Alicante", comunidad: "Comunidad Valenciana", pais: "España", geo: { type: "Point", coordinates: [0.1027, 38.8403] } },
      { nombre: "Ontinyent", slug: "ontinyent", provincia: "Valencia", comunidad: "Comunidad Valenciana", pais: "España", geo: { type: "Point", coordinates: [-0.6065, 38.8208] } },
      { nombre: "Alcoy", slug: "alcoy", provincia: "Alicante", comunidad: "Comunidad Valenciana", pais: "España", geo: { type: "Point", coordinates: [-0.4735, 38.6983] } },
      { nombre: "Serra", slug: "serra", provincia: "Valencia", comunidad: "Comunidad Valenciana", pais: "España", geo: { type: "Point", coordinates: [-0.4265, 39.7008] } }
    ]);

    const hosts = await Host.insertMany([
      { name: "Aventura Mediterránea", slug: "aventura-mediterranea", bio: "Empresa de turismo activo especializada en rutas costeras.", contactEmail: "info@aventuramediterranea.com", phone: "+34 600 123 456", userId: users[1]._id },
      { name: "Montaña Viva", slug: "montana-viva", bio: "Guías certificados para rutas de montaña.", contactEmail: "hola@montanaviva.com", phone: "+34 600 654 321", userId: users[2]._id }
    ]);

    const categories = await Category.insertMany([
      { name: "Rutas costeras", slug: "rutas-costeras", type: "ruta" },
      { name: "Rutas de montaña", slug: "rutas-montana", type: "ruta" },
      { name: "Ciclismo", slug: "ciclismo", type: "ruta" },
      { name: "Material trekking", slug: "material-trekking", type: "producto" },
      { name: "Ropa outdoor", slug: "ropa-outdoor", type: "producto" },
      { name: "Excursiones guiadas", slug: "excursiones-guiadas", type: "evento" }
    ]);

    const rutas = await Ruta.insertMany([
      {
        nombre: "Ruta del Peñón de Ifach",
        descripcion: "Ruta con vistas al Mediterráneo y al entorno natural de Calpe.",
        dificultad: "media", distanciaKm: 4.8, desnivelM: 330, duracionHoras: 2.5, circular: false,
        hostId: hosts[0]._id, locationId: locations[0]._id, categoryIds: [categories[0]._id, categories[1]._id],
        coverImage: { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", alt: "Peñón de Ifach" },
        startPoint: { type: "Point", coordinates: [0.0582, 38.6437] },
        slug: "ruta-del-penon-de-ifach"
      },
      {
        nombre: "Ruta del Montgó",
        descripcion: "Ascenso al Montgó con vistas panorámicas de la costa.",
        dificultad: "dificil", distanciaKm: 8.5, desnivelM: 750, duracionHoras: 4.5, circular: true,
        hostId: hosts[1]._id, locationId: locations[1]._id, categoryIds: [categories[1]._id],
        coverImage: { url: "https://images.unsplash.com/photo-1551632811-561732d1e306", alt: "Montgó" },
        startPoint: { type: "Point", coordinates: [0.1027, 38.8403] },
        slug: "ruta-del-montgo"
      },
      {
        nombre: "Ruta del Pou Clar",
        descripcion: "Paseo por un entorno natural con agua y zonas de descanso.",
        dificultad: "facil", distanciaKm: 3.2, desnivelM: 90, duracionHoras: 1.5, circular: true,
        hostId: hosts[0]._id, locationId: locations[2]._id, categoryIds: [categories[0]._id],
        coverImage: { url: "https://images.unsplash.com/photo-1500534623283-312aade485b7", alt: "Pou Clar" },
        startPoint: { type: "Point", coordinates: [-0.6065, 38.8208] },
        slug: "ruta-del-pou-clar"
      },
      {
        nombre: "Ruta de la Font Roja",
        descripcion: "Recorrido por el parque natural de la Font Roja.",
        dificultad: "media", distanciaKm: 7.1, desnivelM: 410, duracionHoras: 3, circular: true,
        hostId: hosts[1]._id, locationId: locations[3]._id, categoryIds: [categories[1]._id],
        coverImage: { url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e", alt: "Font Roja" },
        startPoint: { type: "Point", coordinates: [-0.4735, 38.6983] },
        slug: "ruta-de-la-font-roja"
      },
      {
        nombre: "Ruta de la Calderona",
        descripcion: "Ruta de montaña por la Sierra Calderona.",
        dificultad: "media", distanciaKm: 10.2, desnivelM: 520, duracionHoras: 4, circular: true,
        hostId: hosts[0]._id, locationId: locations[4]._id, categoryIds: [categories[1]._id, categories[2]._id],
        coverImage: { url: "https://images.unsplash.com/photo-1464278533981-50106e6176b1", alt: "Calderona" },
        startPoint: { type: "Point", coordinates: [-0.4265, 39.7008] },
        slug: "ruta-de-la-calderona"
      }
    ]);

    const now = new Date();
    await Departure.insertMany([
      { rutaId: rutas[0]._id, startDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 9, 0), meetingPoint: "Parking Peñón de Ifach", price: { amount: 15, currency: "EUR" }, capacity: 15, stock: 15, status: "open" },
      { rutaId: rutas[0]._id, startDate: new Date(now.getFullYear(), now.getMonth() + 1, 22, 9, 0), meetingPoint: "Parking Peñón de Ifach", price: { amount: 15, currency: "EUR" }, capacity: 15, stock: 0, status: "full" },
      { rutaId: rutas[1]._id, startDate: new Date(now.getFullYear(), now.getMonth() + 1, 20, 7, 30), meetingPoint: "Puerto de Dénia", price: { amount: 20, currency: "EUR" }, capacity: 10, stock: 8, status: "open" },
      { rutaId: rutas[2]._id, startDate: new Date(now.getFullYear(), now.getMonth() + 1, 10, 10, 0), meetingPoint: "Área recreativa Pou Clar", price: { amount: 5, currency: "EUR" }, capacity: 25, stock: 25, status: "open" },
      { rutaId: rutas[3]._id, startDate: new Date(now.getFullYear(), now.getMonth() + 1, 25, 8, 0), meetingPoint: "Font Roja, zona de parking", price: { amount: 12, currency: "EUR" }, capacity: 20, stock: 18, status: "open" },
      { rutaId: rutas[4]._id, startDate: new Date(now.getFullYear(), now.getMonth() + 1, 18, 7, 0), meetingPoint: "Serra, plaza del pueblo", price: { amount: 10, currency: "EUR" }, capacity: 20, stock: 20, status: "open" }
    ]);

    await Promise.all([
      Role.syncIndexes(),
      User.syncIndexes(),
      Host.syncIndexes(),
      Location.syncIndexes(),
      Category.syncIndexes(),
      Image.syncIndexes(),
      Ruta.syncIndexes(),
      Departure.syncIndexes()
    ]);

    console.log(`Seed completado: ${roles.length} roles, ${users.length} users, ${hosts.length} hosts, ${locations.length} locations, ${categories.length} categories, ${rutas.length} rutas, 6 departures.`);
  } catch (error) {
    console.error("Error ejecutando seed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();
