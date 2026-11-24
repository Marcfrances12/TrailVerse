// Pruebas HTTP de las rutas de comentarios: middleware de auth real (JWT en cookie),
// validación, permisos y errorHandler. Los repositorios se simulan, no hace falta MongoDB.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
process.env.JWT_SECRET ||= crypto.randomBytes(32).toString("hex");
process.env.JWT_REFRESH_SECRET ||= crypto.randomBytes(32).toString("hex");

const express = require("express");
const cookieParser = require("cookie-parser");
const commentsRoutes = require("../src/routes/comments.routes");
const adminRoutes = require("../src/routes/admin.routes");
const { notFound, errorHandler } = require("../src/middlewares/error.middleware");
const usersRepo = require("../src/repos/users.repo");
const revokedTokensRepo = require("../src/repos/revoked-tokens.repo");
const commentsRepo = require("../src/repos/comments.repo");
const shopRepo = require("../src/repos/shop.repo");
const { signAccessToken } = require("../src/utils/jwt");
const { ACCESS_COOKIE } = require("../src/utils/auth-cookie");

const USUARIOS = {
  "65a000000000000000000001": "USER",
  "65a000000000000000000002": "USER",
  "65a000000000000000000009": "ADMIN"
};
const [AUTOR, OTRO, ADMIN] = Object.keys(USUARIOS);
const RUTA = { _id: "67a000000000000000000001" };
const COMENTARIO_ID = "68a000000000000000000001";
const fecha = new Date("2026-11-01T10:00:00Z");

const cookieDe = (id) => `${ACCESS_COOKIE}=${signAccessToken({ id, role: USUARIOS[id] })}`;

let base;
let servidor;
let comentarios;
const originales = {};

function comentario(extra = {}) {
  return {
    _id: COMENTARIO_ID,
    userId: { _id: AUTOR, username: "autor" },
    rutaId: RUTA._id,
    texto: "Muy bonita",
    valoracion: 5,
    sentimiento: null,
    deleted_at: null,
    created_at: fecha,
    updated_at: fecha,
    ...extra
  };
}

test.before(async () => {
  Object.assign(originales, {
    users: { ...usersRepo },
    revoked: { ...revokedTokensRepo },
    comments: { ...commentsRepo },
    shop: { ...shopRepo }
  });

  usersRepo.getById = async (id) =>
    USUARIOS[id]
      ? { _id: id, email: `${id}@x.com`, isActive: true, roleId: { name: USUARIOS[id], isActive: true, deleted_at: null } }
      : null;
  revokedTokensRepo.isRevoked = async () => false;
  shopRepo.idDeRutaVisible = async (slug) => (slug === "ruta-activa" ? RUTA : null);

  // Almacén en memoria mínimo para los repositorios de comentarios.
  Object.assign(commentsRepo, {
    getActivoById: async (id) => comentarios.find((c) => c._id === id && !c.deleted_at) ?? null,
    getAnyById: async (id) => comentarios.find((c) => c._id === id) ?? null,
    existeDeUsuario: async (userId) => comentarios.some((c) => String(c.userId._id) === String(userId) && !c.deleted_at),
    crear: async (datos) => {
      const nuevo = comentario({ ...datos, userId: { _id: datos.userId, username: "nuevo" } });
      comentarios.push(nuevo);
      return nuevo;
    },
    getConAutor: async (id) => comentarios.find((c) => c._id === id),
    actualizar: async (id, cambios) => {
      const c = comentarios.find((x) => x._id === id);
      Object.assign(c, cambios, { updated_at: new Date() });
      return c;
    },
    softDelete: async (id, deletedBy) => {
      const c = comentarios.find((x) => x._id === id && !x.deleted_at);
      if (!c) return null;
      Object.assign(c, { deleted_at: new Date(), deletedBy });
      return c;
    },
    listarDeRuta: async () => ({ items: comentarios.filter((c) => !c.deleted_at), total: comentarios.length }),
    estadisticasDeRuta: async () => ({ total: 1, media: 5, reparto: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } }),
    listarAdmin: async () => ({ items: comentarios, total: comentarios.length }),
    sentimientoPorRuta: async () => []
  });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/comments", commentsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use(notFound);
  app.use(errorHandler);

  await new Promise((resolver) => {
    servidor = app.listen(0, resolver);
  });
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});

test.after(() => {
  servidor?.close();
  Object.assign(usersRepo, originales.users);
  Object.assign(revokedTokensRepo, originales.revoked);
  Object.assign(commentsRepo, originales.comments);
  Object.assign(shopRepo, originales.shop);
});

test.beforeEach(() => {
  comentarios = [comentario()];
});

async function peticion(metodo, ruta, { usuario, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (usuario) headers.Cookie = cookieDe(usuario);
  const respuesta = await fetch(`${base}${ruta}`, { method: metodo, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: respuesta.status, cuerpo: await respuesta.json().catch(() => null) };
}

test("un visitante puede leer los comentarios pero no publicar ni borrar (401)", async () => {
  const lista = await peticion("GET", "/comments/rutas/ruta-activa");
  assert.equal(lista.status, 200);
  assert.equal(lista.cuerpo.data[0].esMio, false);

  assert.equal((await peticion("POST", "/comments/rutas/ruta-activa", { body: { texto: "Hola", valoracion: 4 } })).status, 401);
  assert.equal((await peticion("DELETE", `/comments/${COMENTARIO_ID}`)).status, 401);
});

test("con sesión, el listado marca el comentario propio", async () => {
  const { cuerpo } = await peticion("GET", "/comments/rutas/ruta-activa", { usuario: AUTOR });
  assert.equal(cuerpo.data[0].esMio, true);
  assert.equal(cuerpo.yaComentado, true);
});

test("publicar valida el cuerpo y responde 201, 400 o 409", async () => {
  const invalido = await peticion("POST", "/comments/rutas/ruta-activa", { usuario: OTRO, body: { texto: "Hola", valoracion: 7 } });
  assert.equal(invalido.status, 400);

  const extra = await peticion("POST", "/comments/rutas/ruta-activa", { usuario: OTRO, body: { texto: "Hola", valoracion: 4, userId: AUTOR } });
  assert.equal(extra.status, 400, "no se aceptan campos extra como userId");

  const creado = await peticion("POST", "/comments/rutas/ruta-activa", { usuario: OTRO, body: { texto: "Genial", valoracion: 4 } });
  assert.equal(creado.status, 201);

  const duplicado = await peticion("POST", "/comments/rutas/ruta-activa", { usuario: AUTOR, body: { texto: "Otra", valoracion: 3 } });
  assert.equal(duplicado.status, 409);

  const rutaOculta = await peticion("POST", "/comments/rutas/ruta-borrador", { usuario: OTRO, body: { texto: "Hola", valoracion: 3 } });
  assert.equal(rutaOculta.status, 404);
});

test("un usuario no puede borrar ni editar comentarios de otros (403)", async () => {
  assert.equal((await peticion("DELETE", `/comments/${COMENTARIO_ID}`, { usuario: OTRO })).status, 403);
  assert.equal((await peticion("PATCH", `/comments/${COMENTARIO_ID}`, { usuario: OTRO, body: { valoracion: 1 } })).status, 403);
  assert.equal(comentarios[0].deleted_at, null);
  assert.equal(comentarios[0].valoracion, 5);
});

test("el autor edita y borra su propio comentario", async () => {
  const editado = await peticion("PATCH", `/comments/${COMENTARIO_ID}`, { usuario: AUTOR, body: { valoracion: 4 } });
  assert.equal(editado.status, 200);
  assert.equal(editado.cuerpo.data.valoracion, 4);

  const borrado = await peticion("DELETE", `/comments/${COMENTARIO_ID}`, { usuario: AUTOR });
  assert.equal(borrado.status, 200);
  assert.equal(String(comentarios[0].deletedBy), AUTOR);

  assert.equal((await peticion("DELETE", `/comments/${COMENTARIO_ID}`, { usuario: AUTOR })).status, 404);
});

test("un id no válido devuelve 400", async () => {
  assert.equal((await peticion("DELETE", "/comments/abc", { usuario: AUTOR })).status, 400);
});

test("solo el admin accede a la moderación y puede borrar comentarios ajenos", async () => {
  assert.equal((await peticion("GET", "/admin/comments", { usuario: OTRO })).status, 403);
  assert.equal((await peticion("GET", "/admin/comments/sentimiento", { usuario: OTRO })).status, 403);
  assert.equal((await peticion("GET", "/admin/comments")).status, 401);

  const lista = await peticion("GET", "/admin/comments?estado=todos", { usuario: ADMIN });
  assert.equal(lista.status, 200);
  assert.equal(lista.cuerpo.total, 1);

  assert.equal((await peticion("GET", "/admin/comments?estado=raro", { usuario: ADMIN })).status, 400);
  assert.equal((await peticion("GET", "/admin/comments/sentimiento", { usuario: ADMIN })).status, 200);

  const borrado = await peticion("DELETE", `/admin/comments/${COMENTARIO_ID}`, { usuario: ADMIN });
  assert.equal(borrado.status, 200);
  assert.equal(String(comentarios[0].deletedBy), ADMIN);
});

test("el admin no puede reescribir la opinión de un cliente (403)", async () => {
  assert.equal((await peticion("PATCH", `/comments/${COMENTARIO_ID}`, { usuario: ADMIN, body: { texto: "Cambiado" } })).status, 403);
});
