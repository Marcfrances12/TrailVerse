const Category = require("../models/category.model");
const Departure = require("../models/departure.model");
const Host = require("../models/host.model");
const Location = require("../models/location.model");
const Role = require("../models/role.model");
const Ruta = require("../models/ruta.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

const noBorrados = { deleted_at: null };

function errorRelacion(campo, mensaje) {
  return AppError.badRequest("Una o más relaciones no son válidas", [
    { origen: "body", campo, mensaje }
  ]);
}

async function exigirActivo(Model, id, nombre, campo) {
  if (id == null) return null;

  const documento = await Model.findOne({ _id: id, isActive: true, ...noBorrados }).select("_id");
  if (!documento) {
    throw errorRelacion(campo, `${nombre} no existe, está inactivo o se encuentra eliminado`);
  }
  return documento;
}

async function validarRolDeUsuario(roleId, campo = "roleId") {
  return exigirActivo(Role, roleId, "El rol", campo);
}

async function validarRelacionesUsuario(datos) {
  if (Object.hasOwn(datos, "roleId")) {
    if (datos.roleId == null) throw errorRelacion("roleId", "El usuario debe tener un rol activo");
    await validarRolDeUsuario(datos.roleId);
  }
}

async function validarRelacionesHost(datos) {
  if (!Object.hasOwn(datos, "userId") || datos.userId == null) return;

  const user = await User.findOne({ _id: datos.userId, isActive: true, ...noBorrados }).select("roleId");
  if (!user) {
    throw errorRelacion("userId", "El usuario asociado no existe, está inactivo o se encuentra eliminado");
  }
  await validarRolDeUsuario(user.roleId, "userId");
}

async function validarPadreCategoria(parentId, categoryId) {
  if (parentId == null) return;

  const visitados = new Set();
  let actualId = parentId;

  while (actualId != null) {
    const id = String(actualId);
    if (categoryId && id === String(categoryId)) {
      throw errorRelacion("parentId", "La categoría no puede ser su propio padre ni formar un ciclo");
    }
    if (visitados.has(id)) {
      throw errorRelacion("parentId", "La jerarquía de categorías ya contiene un ciclo");
    }
    visitados.add(id);

    const parent = await Category.findOne({ _id: actualId, isActive: true, ...noBorrados }).select("parentId");
    if (!parent) {
      throw errorRelacion("parentId", "La categoría padre no existe, está inactiva o se encuentra eliminada");
    }
    actualId = parent.parentId;
  }
}

async function validarRelacionesCategoria(datos, categoryId) {
  if (Object.hasOwn(datos, "parentId")) {
    await validarPadreCategoria(datos.parentId, categoryId);
  }
}

async function validarRelacionesRuta(datos) {
  if (Object.hasOwn(datos, "locationId")) {
    if (datos.locationId == null) throw errorRelacion("locationId", "La ruta debe tener una localización activa");
    await exigirActivo(Location, datos.locationId, "La localización", "locationId");
  }

  if (Object.hasOwn(datos, "hostId") && datos.hostId != null) {
    const host = await Host.findOne({ _id: datos.hostId, isActive: true, ...noBorrados }).select("userId");
    if (!host) {
      throw errorRelacion("hostId", "El host no existe, está inactivo o se encuentra eliminado");
    }
    if (host.userId) {
      await validarRelacionesHost({ userId: host.userId });
    }
  }

  if (Object.hasOwn(datos, "categoryIds")) {
    const ids = datos.categoryIds ?? [];
    if (new Set(ids.map(String)).size !== ids.length) {
      throw errorRelacion("categoryIds", "No se puede repetir una categoría en la ruta");
    }

    if (ids.length > 0) {
      const categories = await Category.find({
        _id: { $in: ids },
        type: "ruta",
        isActive: true,
        ...noBorrados
      }).select("_id");
      if (categories.length !== ids.length) {
        throw errorRelacion("categoryIds", "Todas las categorías deben existir, estar activas y no estar eliminadas");
      }
    }
  }
}

async function validarRelacionesDeparture(datos) {
  if (Object.hasOwn(datos, "rutaId")) {
    if (datos.rutaId == null) throw errorRelacion("rutaId", "La salida debe estar asociada a una ruta activa");
    await exigirActivo(Ruta, datos.rutaId, "La ruta", "rutaId");
  }
}

async function inactivarDependientes(tipo, id, visitados = new Set()) {
  const clave = `${tipo}:${String(id)}`;
  if (visitados.has(clave)) return;
  visitados.add(clave);

  let dependientes = [];

  switch (tipo) {
    case "role": {
      dependientes = await User.find({ roleId: id }).select("_id").lean();
      await User.updateMany({ roleId: id, isActive: true, ...noBorrados }, { $set: { isActive: false } });
      for (const user of dependientes) await inactivarDependientes("user", user._id, visitados);
      break;
    }
    case "user": {
      dependientes = await Host.find({ userId: id }).select("_id").lean();
      await Host.updateMany({ userId: id, isActive: true, ...noBorrados }, { $set: { isActive: false } });
      for (const host of dependientes) await inactivarDependientes("host", host._id, visitados);
      break;
    }
    case "host": {
      dependientes = await Ruta.find({ hostId: id }).select("_id").lean();
      await Ruta.updateMany({ hostId: id, isActive: true, ...noBorrados }, { $set: { isActive: false } });
      for (const ruta of dependientes) await inactivarDependientes("ruta", ruta._id, visitados);
      break;
    }
    case "location": {
      dependientes = await Ruta.find({ locationId: id }).select("_id").lean();
      await Ruta.updateMany({ locationId: id, isActive: true, ...noBorrados }, { $set: { isActive: false } });
      for (const ruta of dependientes) await inactivarDependientes("ruta", ruta._id, visitados);
      break;
    }
    case "category": {
      dependientes = await Category.find({ parentId: id }).select("_id").lean();
      await Category.updateMany({ parentId: id, isActive: true, ...noBorrados }, { $set: { isActive: false } });
      for (const category of dependientes) await inactivarDependientes("category", category._id, visitados);

      const rutas = await Ruta.find({ categoryIds: id }).select("_id").lean();
      await Ruta.updateMany({ categoryIds: id, isActive: true, ...noBorrados }, { $set: { isActive: false } });
      for (const ruta of rutas) await inactivarDependientes("ruta", ruta._id, visitados);
      break;
    }
    case "ruta": {
      dependientes = await Departure.find({ rutaId: id }).select("_id").lean();
      await Departure.updateMany({ rutaId: id, isActive: true, ...noBorrados }, { $set: { isActive: false } });
      break;
    }
  }
}

function estadoNoDisponible(documento) {
  if (!documento) return null;
  if (documento.deleted_at) return "eliminado";
  if (documento.isActive === false) return "inactivo";
  return null;
}

function avisosIntegridadRuta(ruta) {
  const avisos = [];
  const location = ruta.locationId;
  if (location == null) {
    avisos.push("La localización obligatoria no está disponible.");
  } else if (typeof location === "object") {
    const estado = estadoNoDisponible(location);
    if (estado) avisos.push(`La localización «${location.nombre}» está ${estado}.`);
  }

  const host = ruta.hostId;
  if (host && typeof host === "object") {
    const estado = estadoNoDisponible(host);
    if (estado) avisos.push(`El host «${host.name}» está ${estado}.`);

    const user = host.userId;
    if (user && typeof user === "object") {
      const estadoUsuario = estadoNoDisponible(user);
      if (estadoUsuario) avisos.push(`El usuario «${user.name}» asociado al host está ${estadoUsuario}.`);

      const role = user.roleId;
      if (role && typeof role === "object") {
        const estadoRol = estadoNoDisponible(role);
        if (estadoRol) avisos.push(`El rol «${role.name}» del usuario del host está ${estadoRol}.`);
      }
    }
  }

  const categories = Array.isArray(ruta.categoryIds) ? ruta.categoryIds : [];
  for (const category of categories) {
    if (category && typeof category === "object") {
      const estado = estadoNoDisponible(category);
      if (estado) avisos.push(`La categoría «${category.name}» está ${estado}.`);
    }
  }

  return avisos;
}

async function exigirSinReferencias(Model, filtro, nombre) {
  if (await Model.exists(filtro)) {
    throw AppError.conflict(`No se puede eliminar definitivamente ${nombre} porque todavía está referenciado`);
  }
}

async function comprobarBorradoDefinitivo(tipo, id) {
  switch (tipo) {
    case "role":
      await exigirSinReferencias(User, { roleId: id }, "el rol");
      break;
    case "user":
      await exigirSinReferencias(Host, { userId: id }, "el usuario");
      break;
    case "host":
      await exigirSinReferencias(Ruta, { hostId: id }, "el host");
      break;
    case "location":
      await exigirSinReferencias(Ruta, { locationId: id }, "la localización");
      break;
    case "category":
      await exigirSinReferencias(Ruta, { categoryIds: id }, "la categoría");
      await exigirSinReferencias(Category, { parentId: id }, "la categoría");
      break;
    case "ruta":
      await exigirSinReferencias(Departure, { rutaId: id }, "la ruta");
      break;
  }
}

module.exports = {
  validarRelacionesUsuario,
  validarRelacionesHost,
  validarRelacionesCategoria,
  validarRelacionesRuta,
  validarRelacionesDeparture,
  inactivarDependientes,
  avisosIntegridadRuta,
  comprobarBorradoDefinitivo
};
