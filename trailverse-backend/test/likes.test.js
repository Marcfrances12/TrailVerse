const assert = require("node:assert/strict");
const test = require("node:test");
const likesRepo = require("../src/repos/likes.repo");
const shopRepo = require("../src/repos/shop.repo");
const likesService = require("../src/services/likes.service");
const AppError = require("../src/utils/AppError");

const USER_ID = "65a000000000000000000001";
const RUTA = { _id: "67a000000000000000000001", locationId: null, categoryIds: [] };

// Sustituye funciones de los repos durante una prueba y las restaura al terminar.
async function conMocks({ likes = {}, shop = {} }, ejecutar) {
  const originalesLikes = { ...likesRepo };
  const originalesShop = { ...shopRepo };
  Object.assign(likesRepo, likes);
  Object.assign(shopRepo, { idDeRutaVisible: async () => RUTA, ...shop });
  try {
    return await ejecutar();
  } finally {
    Object.assign(likesRepo, originalesLikes);
    Object.assign(shopRepo, originalesShop);
  }
}

const esError = (statusCode, message) => (error) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, statusCode);
  if (message) assert.equal(error.message, message);
  return true;
};

test("dar like crea el like y devuelve el total actualizado", async () => {
  const creados = [];
  await conMocks({
    likes: {
      existe: async () => creados.length > 0,
      crear: async (userId, rutaId) => creados.push({ userId, rutaId }),
      contarDeRuta: async () => creados.length
    }
  }, async () => {
    const resultado = await likesService.darLike("ruta-activa", USER_ID);
    assert.deepEqual(resultado, { total: 1, likedByMe: true });
    assert.deepEqual(creados, [{ userId: USER_ID, rutaId: RUTA._id }]);
  });
});

test("dar like dos veces a la misma ruta devuelve 409 sin crear nada", async () => {
  let creado = false;
  await conMocks({
    likes: {
      existe: async () => true,
      crear: async () => { creado = true; }
    }
  }, async () => {
    await assert.rejects(
      likesService.darLike("ruta-activa", USER_ID),
      esError(409, likesService.MENSAJE_DUPLICADO)
    );
    assert.equal(creado, false);
  });
});

test("si dos peticiones llegan a la vez, el índice único (E11000) también responde 409", async () => {
  await conMocks({
    likes: {
      existe: async () => false,
      crear: async () => {
        const error = new Error("E11000 duplicate key error");
        error.code = 11000;
        throw error;
      }
    }
  }, async () => {
    await assert.rejects(
      likesService.darLike("ruta-activa", USER_ID),
      esError(409, likesService.MENSAJE_DUPLICADO)
    );
  });
});

test("otros errores al crear el like no se convierten en 409", async () => {
  await conMocks({
    likes: {
      existe: async () => false,
      crear: async () => { throw new Error("fallo de conexión"); }
    }
  }, async () => {
    await assert.rejects(likesService.darLike("ruta-activa", USER_ID), /fallo de conexión/);
  });
});

test("no se puede dar like a una ruta que no existe o no es visible", async () => {
  let consultado = false;
  await conMocks({
    shop: { idDeRutaVisible: async () => null },
    likes: { existe: async () => { consultado = true; return false; } }
  }, async () => {
    await assert.rejects(likesService.darLike("ruta-borrador", USER_ID), esError(404, "Ruta no encontrada"));
    assert.equal(consultado, false);
  });
});

test("un slug no válido se rechaza con 400 antes de consultar la base de datos", async () => {
  let consultado = false;
  await conMocks({
    shop: { idDeRutaVisible: async () => { consultado = true; return RUTA; } }
  }, async () => {
    await assert.rejects(likesService.darLike("Slug No Valido", USER_ID), esError(400));
    assert.equal(consultado, false);
  });
});

test("quitar un like existente devuelve el total actualizado", async () => {
  await conMocks({
    likes: {
      eliminar: async () => ({ _id: "x" }),
      contarDeRuta: async () => 4,
      existe: async () => false
    }
  }, async () => {
    const resultado = await likesService.quitarLike("ruta-activa", USER_ID);
    assert.deepEqual(resultado, { total: 4, likedByMe: false });
  });
});

test("quitar un like que no existe devuelve 404", async () => {
  await conMocks({
    likes: { eliminar: async () => null }
  }, async () => {
    await assert.rejects(
      likesService.quitarLike("ruta-activa", USER_ID),
      esError(404, "No has dado like a esta ruta")
    );
  });
});

test("un visitante sin sesión ve el total y likedByMe en false", async () => {
  let preguntado = false;
  await conMocks({
    likes: {
      contarDeRuta: async () => 7,
      existe: async () => { preguntado = true; return true; }
    }
  }, async () => {
    const resultado = await likesService.getEstado("ruta-activa", null);
    assert.deepEqual(resultado, { total: 7, likedByMe: false });
    assert.equal(preguntado, false);
  });
});

test("mis likes conservan el orden del like más reciente y omiten rutas no visibles", async () => {
  const A = "67a000000000000000000001";
  const B = "67a000000000000000000002";
  const C = "67a000000000000000000003";

  await conMocks({
    likes: { rutaIdsDeUsuario: async () => [C, A, B] },
    shop: {
      // B ya no es visible; el repo devuelve el resto en otro orden.
      rutasVisiblesPorIds: async () => [{ _id: A, coverImage: null }, { _id: C, coverImage: null }],
      imagenesDeRutas: async () => [],
      preciosDesdeDeRutas: async () => [],
      likesDeRutas: async () => [{ _id: C, total: 2 }]
    }
  }, async () => {
    const rutas = await likesService.getMisLikes(USER_ID);
    assert.deepEqual(rutas.map((ruta) => ruta._id), [C, A]);
    assert.deepEqual(rutas.map((ruta) => ruta.likes), [2, 0]);
  });
});
