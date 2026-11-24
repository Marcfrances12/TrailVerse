const assert = require("node:assert/strict");
const test = require("node:test");
const commentsRepo = require("../src/repos/comments.repo");
const shopRepo = require("../src/repos/shop.repo");
const commentsService = require("../src/services/comments.service");
const AppError = require("../src/utils/AppError");

const AUTOR = { id: "65a000000000000000000001", role: "CLIENT" };
const OTRO = { id: "65a000000000000000000002", role: "CLIENT" };
const ADMIN = { id: "65a000000000000000000009", role: "ADMIN" };
const RUTA = { _id: "67a000000000000000000001", locationId: null, categoryIds: [] };
const COMENTARIO_ID = "68a000000000000000000001";

const fecha = new Date("2026-11-01T10:00:00Z");
const comentarioDe = (userId, extra = {}) => ({
  _id: COMENTARIO_ID,
  userId,
  rutaId: RUTA._id,
  texto: "Ruta preciosa y bien señalizada",
  valoracion: 5,
  sentimiento: null,
  deleted_at: null,
  created_at: fecha,
  updated_at: fecha,
  ...extra
});

async function conMocks({ comments = {}, shop = {} }, ejecutar) {
  const originalesComments = { ...commentsRepo };
  const originalesShop = { ...shopRepo };
  Object.assign(commentsRepo, comments);
  Object.assign(shopRepo, { idDeRutaVisible: async () => RUTA, ...shop });
  try {
    return await ejecutar();
  } finally {
    Object.assign(commentsRepo, originalesComments);
    Object.assign(shopRepo, originalesShop);
  }
}

const esError = (statusCode, message) => (error) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, statusCode);
  if (message) assert.equal(error.message, message);
  return true;
};

test("crear un comentario lo guarda con el usuario y la ruta y devuelve el autor", async () => {
  const creados = [];
  await conMocks({
    comments: {
      existeDeUsuario: async () => false,
      crear: async (datos) => { creados.push(datos); return { _id: COMENTARIO_ID }; },
      getConAutor: async () => comentarioDe({ _id: AUTOR.id, username: "ana", profile: { name: "Ana" } })
    }
  }, async () => {
    const comentario = await commentsService.crear("ruta-activa", { texto: "  Muy bonita  ", valoracion: 4 }, AUTOR);
    assert.deepEqual(creados, [{ texto: "Muy bonita", valoracion: 4, userId: AUTOR.id, rutaId: RUTA._id }]);
    assert.equal(comentario.autor.nombre, "Ana");
    assert.equal(comentario.esMio, true);
    assert.equal("sentimiento" in comentario, false);
  });
});

test("un usuario no puede comentar dos veces la misma ruta (409)", async () => {
  let creado = false;
  await conMocks({
    comments: { existeDeUsuario: async () => true, crear: async () => { creado = true; } }
  }, async () => {
    await assert.rejects(
      commentsService.crear("ruta-activa", { texto: "Otra vez", valoracion: 3 }, AUTOR),
      esError(409, commentsService.MENSAJE_DUPLICADO)
    );
    assert.equal(creado, false);
  });
});

test("si dos envíos llegan a la vez, el índice único (E11000) también responde 409", async () => {
  await conMocks({
    comments: {
      existeDeUsuario: async () => false,
      crear: async () => { const error = new Error("E11000"); error.code = 11000; throw error; }
    }
  }, async () => {
    await assert.rejects(
      commentsService.crear("ruta-activa", { texto: "Hola hola", valoracion: 3 }, AUTOR),
      esError(409, commentsService.MENSAJE_DUPLICADO)
    );
  });
});

test("una valoración fuera de 1..5 o un texto vacío devuelven 400", async () => {
  await conMocks({ comments: { existeDeUsuario: async () => false } }, async () => {
    await assert.rejects(commentsService.crear("ruta-activa", { texto: "Bien", valoracion: 6 }, AUTOR), esError(400));
    await assert.rejects(commentsService.crear("ruta-activa", { texto: "  ", valoracion: 3 }, AUTOR), esError(400));
  });
});

test("no se puede comentar una ruta que no es visible (404)", async () => {
  await conMocks({ shop: { idDeRutaVisible: async () => null } }, async () => {
    await assert.rejects(
      commentsService.crear("ruta-borrador", { texto: "Bonita", valoracion: 5 }, AUTOR),
      esError(404, "Ruta no encontrada")
    );
  });
});

test("un usuario no puede borrar el comentario de otro usuario (403)", async () => {
  let borrado = false;
  await conMocks({
    comments: {
      getActivoById: async () => comentarioDe(AUTOR.id),
      softDelete: async () => { borrado = true; return { _id: COMENTARIO_ID }; }
    }
  }, async () => {
    await assert.rejects(commentsService.eliminar(COMENTARIO_ID, OTRO), esError(403, commentsService.MENSAJE_PROHIBIDO));
    assert.equal(borrado, false);
  });
});

test("el autor puede borrar su propio comentario y queda registrado quién lo borró", async () => {
  const llamadas = [];
  await conMocks({
    comments: {
      getActivoById: async () => comentarioDe(AUTOR.id),
      softDelete: async (id, deletedBy) => { llamadas.push({ id, deletedBy }); return { _id: id }; }
    }
  }, async () => {
    const resultado = await commentsService.eliminar(COMENTARIO_ID, AUTOR);
    assert.deepEqual(resultado, { _id: COMENTARIO_ID });
    assert.deepEqual(llamadas, [{ id: COMENTARIO_ID, deletedBy: AUTOR.id }]);
  });
});

test("un admin puede borrar el comentario de cualquier usuario", async () => {
  await conMocks({
    comments: {
      getActivoById: async () => comentarioDe(AUTOR.id),
      softDelete: async (id) => ({ _id: id })
    }
  }, async () => {
    const resultado = await commentsService.eliminar(COMENTARIO_ID, ADMIN);
    assert.deepEqual(resultado, { _id: COMENTARIO_ID });
  });
});

test("solo el autor puede editar: ni otro usuario ni un admin (403)", async () => {
  let editado = false;
  await conMocks({
    comments: {
      getActivoById: async () => comentarioDe(AUTOR.id),
      actualizar: async () => { editado = true; return comentarioDe(AUTOR.id); }
    }
  }, async () => {
    await assert.rejects(commentsService.editar(COMENTARIO_ID, { valoracion: 1 }, OTRO), esError(403));
    await assert.rejects(commentsService.editar(COMENTARIO_ID, { valoracion: 1 }, ADMIN), esError(403));
    assert.equal(editado, false);
  });
});

test("el autor edita su comentario", async () => {
  const cambiosRecibidos = [];
  await conMocks({
    comments: {
      getActivoById: async () => comentarioDe(AUTOR.id),
      actualizar: async (id, cambios) => {
        cambiosRecibidos.push(cambios);
        return comentarioDe({ _id: AUTOR.id, username: "ana" }, { ...cambios, updated_at: new Date("2026-11-02") });
      }
    }
  }, async () => {
    const comentario = await commentsService.editar(COMENTARIO_ID, { texto: "Mejor de lo esperado" }, AUTOR);
    assert.deepEqual(cambiosRecibidos, [{ texto: "Mejor de lo esperado" }]);
    assert.equal(comentario.editado, true);
    assert.equal(comentario.autor.nombre, "ana");
  });
});

test("borrar o editar un comentario inexistente devuelve 404 y un id no válido 400", async () => {
  await conMocks({ comments: { getActivoById: async () => null } }, async () => {
    await assert.rejects(commentsService.eliminar(COMENTARIO_ID, AUTOR), esError(404));
    await assert.rejects(commentsService.editar(COMENTARIO_ID, { valoracion: 2 }, AUTOR), esError(404));
    await assert.rejects(commentsService.eliminar("no-es-un-id", AUTOR), esError(400));
  });
});

test("el listado público marca esMio solo en los comentarios del usuario actual", async () => {
  await conMocks({
    comments: {
      listarDeRuta: async () => ({
        items: [comentarioDe({ _id: AUTOR.id, username: "ana" }), comentarioDe({ _id: OTRO.id, username: "luis" })],
        total: 2
      }),
      estadisticasDeRuta: async () => ({ total: 2, media: 4.5, reparto: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } }),
      existeDeUsuario: async () => true
    }
  }, async () => {
    const resultado = await commentsService.listarDeRuta("ruta-activa", {}, AUTOR);
    assert.deepEqual(resultado.data.map((c) => c.esMio), [true, false]);
    assert.equal(resultado.yaComentado, true);
    assert.equal(resultado.page, 1);
    assert.equal(resultado.estadisticas.media, 4.5);
  });
});

test("el sentimiento por ruta calcula porcentajes y marca en alerta las rutas con muchas opiniones negativas", async () => {
  await conMocks({
    comments: {
      sentimientoPorRuta: async () => [
        {
          rutaId: "67a000000000000000000001", nombre: "Buena", slug: "buena",
          total: 4, media: 4.75, positivos: 4, neutros: 0, negativos: 0, puntuacionMedia: 0.8,
          temas: [["paisaje", "guia"], ["paisaje"], [], ["paisaje"]], ultimo: fecha
        },
        {
          rutaId: "67a000000000000000000002", nombre: "Mala", slug: "mala",
          total: 4, media: 2, positivos: 1, neutros: 0, negativos: 2, puntuacionMedia: -0.4,
          temas: [["señalizacion"], ["señalizacion", "precio"], null], ultimo: fecha
        }
      ]
    }
  }, async () => {
    const { global, rutas } = await commentsService.sentimiento();
    assert.equal(rutas[0].slug, "mala");
    assert.equal(rutas[0].alerta, true);
    assert.equal(rutas[0].pendientes, 1);
    assert.deepEqual(rutas[0].porcentajes, { positivo: 33, neutro: 0, negativo: 67 });
    assert.deepEqual(rutas[0].temas[0], { tema: "señalizacion", veces: 2 });
    assert.equal(rutas[1].alerta, false);
    assert.equal(global.total, 8);
    assert.equal(global.rutasEnAlerta, 1);
    assert.equal(global.media, 3.4);
    assert.deepEqual(global.temas[0], { tema: "paisaje", veces: 3 });
  });
});
