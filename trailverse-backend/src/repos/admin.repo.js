const Ruta = require("../models/ruta.model");
const Location = require("../models/location.model");
const Category = require("../models/category.model");
const Host = require("../models/host.model");
const User = require("../models/user.model");
const Departure = require("../models/departure.model");

async function contarEntidad(modelo) {
  const [total, activas, eliminadas] = await Promise.all([
    modelo.countDocuments({ deleted_at: null }),
    modelo.countDocuments({ deleted_at: null, isActive: true }),
    modelo.countDocuments({ deleted_at: { $ne: null } })
  ]);

  return { total, activas, eliminadas };
}

async function contarSalidas() {
  const ahora = new Date();
  const noBorradas = { deleted_at: null };

  const [total, proximas, abiertas, llenas] = await Promise.all([
    Departure.countDocuments(noBorradas),
    Departure.countDocuments({ ...noBorradas, startDate: { $gte: ahora } }),
    Departure.countDocuments({ ...noBorradas, isActive: true, status: "open", startDate: { $gte: ahora } }),
    Departure.countDocuments({ ...noBorradas, status: "full", startDate: { $gte: ahora } })
  ]);

  return { total, proximas, abiertas, llenas };
}

async function resumen() {
  const [rutas, localizaciones, categorias, hosts, usuarios, salidas] = await Promise.all([
    contarEntidad(Ruta),
    contarEntidad(Location),
    contarEntidad(Category),
    contarEntidad(Host),
    contarEntidad(User),
    contarSalidas()
  ]);

  return { rutas, localizaciones, categorias, hosts, usuarios, salidas };
}

module.exports = { resumen };
