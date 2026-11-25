const assert = require("node:assert/strict");
const test = require("node:test");
const cartRepo = require("../src/repos/cart.repo");
const shopRepo = require("../src/repos/shop.repo");
const cartService = require("../src/services/cart.service");
const AppError = require("../src/utils/AppError");

const USER_ID = "65a000000000000000000001";
const CART = { _id: "66c000000000000000000001", userId: USER_ID };
const DEP_A = "68d000000000000000000001";
const DEP_B = "68d000000000000000000002";

const manana = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

const ruta = (extra = {}) => ({
  _id: "67a000000000000000000001",
  nombre: "Pica d'Estats",
  slug: "pica-destats",
  coverImage: { url: "portada.jpg", alt: "" },
  status: "published",
  isActive: true,
  deleted_at: null,
  ...extra
});

const salida = (id, extra = {}) => ({
  _id: id,
  rutaId: ruta(),
  startDate: manana(),
  endDate: null,
  meetingPoint: "Parking",
  price: { amount: 25.5, currency: "EUR" },
  stock: 5,
  status: "open",
  isActive: true,
  deleted_at: null,
  ...extra
});

/**
 * Carrito en memoria que sustituye al repo durante cada prueba.
 * `salidas` es el "catálogo" de departures disponibles.
 */
function carritoFalso({ salidas = {}, items = [], conCarrito = true } = {}) {
  const estado = { carrito: conCarrito ? { ...CART } : null, items: items.map((item) => ({ ...item })) };
  let siguiente = 1;

  return {
    estado,
    repo: {
      carritoDeUsuario: async () => estado.carrito,
      obtenerOCrearCarrito: async () => {
        estado.carrito ??= { ...CART };
        return estado.carrito;
      },
      salidaParaCarrito: async (id) => salidas[id] ?? null,
      buscarItem: async (cartId, departureId) =>
        estado.items.find((item) => item.departureId === departureId) ?? null,
      incrementarItem: async (cartId, departureId, cantidad) => {
        const item = estado.items.find((linea) => linea.departureId === departureId);
        if (item) item.quantity += cantidad;
        else estado.items.push({ _id: `item${siguiente++}`, departureId, quantity: cantidad });
      },
      fijarCantidad: async (cartId, departureId, quantity) => {
        estado.items.find((item) => item.departureId === departureId).quantity = quantity;
      },
      eliminarItem: async (cartId, departureId) => {
        const indice = estado.items.findIndex((item) => item.departureId === departureId);
        if (indice === -1) return null;
        return estado.items.splice(indice, 1)[0];
      },
      vaciar: async () => { estado.items = []; },
      eliminarItemsPorIds: async () => {},
      itemsDeCarrito: async () =>
        estado.items.map((item) => ({ ...item, departureId: salidas[item.departureId] ?? null }))
    }
  };
}

async function conCarrito(opciones, ejecutar) {
  const falso = carritoFalso(opciones);
  const originalesCart = { ...cartRepo };
  const originalesShop = { ...shopRepo };
  Object.assign(cartRepo, falso.repo);
  Object.assign(shopRepo, { imagenesDeEntidades: async () => [] });
  try {
    return await ejecutar(falso.estado);
  } finally {
    Object.assign(cartRepo, originalesCart);
    Object.assign(shopRepo, originalesShop);
  }
}

const esError = (statusCode, message) => (error) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, statusCode);
  if (message) assert.match(error.message, message instanceof RegExp ? message : new RegExp(message));
  return true;
};

test("añadir una salida crea el carrito y calcula price, subtotal, total y total_items", async () => {
  await conCarrito({ conCarrito: false, salidas: { [DEP_A]: salida(DEP_A) } }, async () => {
    const carrito = await cartService.anadirItem(USER_ID, { departureId: DEP_A, quantity: 2 });

    assert.equal(carrito.items.length, 1);
    assert.equal(carrito.items[0].price, 25.5);
    assert.equal(carrito.items[0].subtotal, 51);
    assert.equal(carrito.items[0].disponible, true);
    assert.equal(carrito.items[0].ruta.slug, "pica-destats");
    assert.equal(carrito.total, 51);
    assert.equal(carrito.total_items, 2);
    assert.equal(carrito.currency, "EUR");
  });
});

test("añadir la misma salida otra vez suma la cantidad en lugar de duplicar la línea", async () => {
  await conCarrito({ salidas: { [DEP_A]: salida(DEP_A) } }, async (estado) => {
    await cartService.anadirItem(USER_ID, { departureId: DEP_A });
    const carrito = await cartService.anadirItem(USER_ID, { departureId: DEP_A, quantity: 2 });

    assert.equal(estado.items.length, 1);
    assert.equal(carrito.items[0].quantity, 3);
    assert.equal(carrito.total_items, 3);
  });
});

test("la cantidad por defecto al añadir es 1", async () => {
  await conCarrito({ salidas: { [DEP_A]: salida(DEP_A) } }, async () => {
    const carrito = await cartService.anadirItem(USER_ID, { departureId: DEP_A });
    assert.equal(carrito.total_items, 1);
  });
});

test("no se puede añadir más plazas que el stock, contando las que ya hay en el carrito", async () => {
  await conCarrito({
    salidas: { [DEP_A]: salida(DEP_A, { stock: 3 }) },
    items: [{ _id: "i1", departureId: DEP_A, quantity: 2 }]
  }, async (estado) => {
    await assert.rejects(
      cartService.anadirItem(USER_ID, { departureId: DEP_A, quantity: 2 }),
      esError(409, "ya tienes 2 en el carrito")
    );
    assert.equal(estado.items[0].quantity, 2);
  });
});

test("una salida sin stock no se puede añadir", async () => {
  await conCarrito({ salidas: { [DEP_A]: salida(DEP_A, { stock: 0 }) } }, async () => {
    await assert.rejects(
      cartService.anadirItem(USER_ID, { departureId: DEP_A }),
      esError(409, cartService.MENSAJES.sinPlazas)
    );
  });
});

test("solo se aceptan salidas en EUR", async () => {
  await conCarrito({
    salidas: { [DEP_A]: salida(DEP_A, { price: { amount: 30, currency: "USD" } }) }
  }, async () => {
    await assert.rejects(
      cartService.anadirItem(USER_ID, { departureId: DEP_A }),
      esError(409, cartService.MENSAJES.moneda)
    );
  });
});

test("salidas canceladas, pasadas, inactivas o de rutas no publicadas no se pueden añadir", async () => {
  const casos = [
    [salida(DEP_A, { status: "cancelled" }), cartService.MENSAJES.noAbierta],
    [salida(DEP_A, { startDate: new Date(Date.now() - 1000) }), cartService.MENSAJES.pasada],
    [salida(DEP_A, { isActive: false }), cartService.MENSAJES.noDisponible],
    [salida(DEP_A, { deleted_at: new Date() }), cartService.MENSAJES.noDisponible],
    [salida(DEP_A, { rutaId: ruta({ status: "draft" }) }), cartService.MENSAJES.noDisponible]
  ];

  for (const [dep, mensaje] of casos) {
    await conCarrito({ salidas: { [DEP_A]: dep } }, async () => {
      await assert.rejects(cartService.anadirItem(USER_ID, { departureId: DEP_A }), esError(409, mensaje));
    });
  }
});

test("una salida que no existe devuelve 404", async () => {
  await conCarrito({}, async () => {
    await assert.rejects(
      cartService.anadirItem(USER_ID, { departureId: DEP_A }),
      esError(404, cartService.MENSAJES.salidaNoEncontrada)
    );
  });
});

test("un id o una cantidad no válidos se rechazan con 400 sin tocar la base de datos", async () => {
  let consultado = false;
  await conCarrito({}, async () => {
    cartRepo.salidaParaCarrito = async () => { consultado = true; return null; };
    await assert.rejects(cartService.anadirItem(USER_ID, { departureId: "abc" }), esError(400));
    await assert.rejects(cartService.anadirItem(USER_ID, { departureId: DEP_A, quantity: 0 }), esError(400));
    await assert.rejects(cartService.anadirItem(USER_ID, { departureId: DEP_A, quantity: 1.5 }), esError(400));
    assert.equal(consultado, false);
  });
});

test("actualizar fija la cantidad y respeta el stock", async () => {
  await conCarrito({
    salidas: { [DEP_A]: salida(DEP_A, { stock: 4 }) },
    items: [{ _id: "i1", departureId: DEP_A, quantity: 1 }]
  }, async () => {
    const carrito = await cartService.actualizarItem(USER_ID, DEP_A, { quantity: 4 });
    assert.equal(carrito.items[0].quantity, 4);
    assert.equal(carrito.total, 102);

    await assert.rejects(cartService.actualizarItem(USER_ID, DEP_A, { quantity: 5 }), esError(409, "Solo quedan 4 plazas"));
  });
});

test("actualizar o quitar una salida que no está en el carrito devuelve 404", async () => {
  await conCarrito({ salidas: { [DEP_A]: salida(DEP_A) } }, async () => {
    await assert.rejects(cartService.actualizarItem(USER_ID, DEP_A, { quantity: 2 }), esError(404, cartService.MENSAJES.noEnCarrito));
    await assert.rejects(cartService.quitarItem(USER_ID, DEP_A), esError(404, cartService.MENSAJES.noEnCarrito));
  });
});

test("quitar una salida la elimina y recalcula los totales", async () => {
  await conCarrito({
    salidas: { [DEP_A]: salida(DEP_A), [DEP_B]: salida(DEP_B, { price: { amount: 10, currency: "EUR" } }) },
    items: [
      { _id: "i1", departureId: DEP_A, quantity: 1 },
      { _id: "i2", departureId: DEP_B, quantity: 3 }
    ]
  }, async () => {
    const carrito = await cartService.quitarItem(USER_ID, DEP_A);
    assert.equal(carrito.items.length, 1);
    assert.equal(carrito.total, 30);
    assert.equal(carrito.total_items, 3);
  });
});

test("las líneas que dejan de estar disponibles se marcan y no suman en los totales", async () => {
  await conCarrito({
    salidas: {
      [DEP_A]: salida(DEP_A, { status: "cancelled" }),
      [DEP_B]: salida(DEP_B, { stock: 1 })
    },
    items: [
      { _id: "i1", departureId: DEP_A, quantity: 2 },
      { _id: "i2", departureId: DEP_B, quantity: 3 }
    ]
  }, async () => {
    const carrito = await cartService.getCarrito(USER_ID);
    assert.equal(carrito.items[0].disponible, false);
    assert.equal(carrito.items[0].motivo, cartService.MENSAJES.noAbierta);
    assert.equal(carrito.items[1].disponible, false);
    assert.match(carrito.items[1].motivo, /Solo quedan 1 plaza/);
    assert.equal(carrito.total, 0);
    assert.equal(carrito.total_items, 0);
  });
});

test("un usuario sin carrito recibe un carrito vacío", async () => {
  await conCarrito({ conCarrito: false }, async () => {
    const carrito = await cartService.getCarrito(USER_ID);
    assert.deepEqual(carrito, { items: [], total: 0, total_items: 0, currency: "EUR" });
  });
});

test("vaciar deja el carrito sin líneas", async () => {
  await conCarrito({
    salidas: { [DEP_A]: salida(DEP_A) },
    items: [{ _id: "i1", departureId: DEP_A, quantity: 2 }]
  }, async (estado) => {
    const carrito = await cartService.vaciar(USER_ID);
    assert.equal(estado.items.length, 0);
    assert.equal(carrito.total, 0);
  });
});

test("los importes se redondean a céntimos", () => {
  const carrito = cartService.calcularCarrito([
    { _id: "i1", quantity: 3, departureId: salida(DEP_A, { price: { amount: 19.99, currency: "EUR" } }) },
    { _id: "i2", quantity: 1, departureId: salida(DEP_B, { price: { amount: 0.1, currency: "EUR" } }) }
  ]);
  assert.equal(carrito.items[0].subtotal, 59.97);
  assert.equal(carrito.total, 60.07);
});
