const assert = require("node:assert/strict");
const test = require("node:test");
const shopRepo = require("../src/repos/shop.repo");
const shopService = require("../src/services/shop.service");
const { listarRutasQuerySchema, homeQuerySchema } = require("../src/validators/shop.validator");

const ID_A = "67a000000000000000000001";
const ID_B = "67a000000000000000000002";
const ID_C = "67a000000000000000000003";

async function conRepo(mocks, ejecutar) {
  const originales = { ...shopRepo };
  Object.assign(shopRepo, mocks);
  try {
    return await ejecutar();
  } finally {
    Object.assign(shopRepo, originales);
  }
}

test("el listado aplica valores por defecto: page 1, limit 12, any y más recientes", () => {
  const resultado = listarRutasQuerySchema.parse({});

  assert.equal(resultado.page, 1);
  assert.equal(resultado.limit, 12);
  assert.equal(resultado.categoryMode, "any");
  assert.deepEqual(resultado.sort, { campo: "created_at", descendente: true });
});

test("limit no puede superar 50 ni ser menor que 1", () => {
  assert.equal(listarRutasQuerySchema.safeParse({ limit: "51" }).success, false);
  assert.equal(listarRutasQuerySchema.safeParse({ limit: "0" }).success, false);
  assert.equal(listarRutasQuerySchema.parse({ limit: "50" }).limit, 50);
});

test("categoria acepta una lista de slugs separada por comas", () => {
  const resultado = listarRutasQuerySchema.parse({ categoria: "Montana, playa" });
  assert.deepEqual(resultado.categoria, ["montana", "playa"]);
});

test("categoria rechaza slugs no válidos y más de 10 valores", () => {
  assert.equal(listarRutasQuerySchema.safeParse({ categoria: "no valido" }).success, false);

  const diez = Array(11).fill("montana").join(",");
  assert.equal(listarRutasQuerySchema.safeParse({ categoria: diez }).success, false);
});

test("host y localizacion aceptan un slug válido", () => {
  assert.equal(listarRutasQuerySchema.parse({ host: "juan-garcia" }).host, "juan-garcia");
  assert.equal(listarRutasQuerySchema.parse({ localizacion: "sierra-norte" }).localizacion, "sierra-norte");
  assert.equal(listarRutasQuerySchema.safeParse({ host: "Juan Garcia" }).success, false);
});

test("sort solo acepta campos de la lista blanca y prefijo - para descendente", () => {
  assert.deepEqual(listarRutasQuerySchema.parse({ sort: "-nombre" }).sort, { campo: "nombre", descendente: true });
  assert.deepEqual(listarRutasQuerySchema.parse({ sort: "distanciaKm" }).sort, { campo: "distanciaKm", descendente: false });
  assert.equal(listarRutasQuerySchema.safeParse({ sort: "password" }).success, false);
  assert.equal(listarRutasQuerySchema.safeParse({ sort: "-status" }).success, false);
});

test("sin criterios el filtro solo incluye rutas visibles", () => {
  const filtro = shopRepo.construirFiltroRuta({});

  assert.deepEqual(filtro, { status: "published", isActive: true, deleted_at: null });
});

test("q se convierte en regex escapada e insensible a mayúsculas", () => {
  const filtro = shopRepo.construirFiltroRuta({ q: "sierra (norte)" });

  assert.ok(filtro.nombre instanceof RegExp);
  assert.equal(filtro.nombre.flags, "i");
  assert.equal(filtro.nombre.test("Ruta por la Sierra (Norte)"), true);
  assert.equal(filtro.nombre.test("Sierra Norte"), false);
});

test("categoryMode any usa $in y all usa $all", () => {
  const any = shopRepo.construirFiltroRuta({ categoryId: [ID_A, ID_B], categoryMode: "any" });
  const all = shopRepo.construirFiltroRuta({ categoryId: [ID_A, ID_B], categoryMode: "all" });

  assert.deepEqual(any.categoryIds, { $in: [ID_A, ID_B] });
  assert.deepEqual(all.categoryIds, { $all: [ID_A, ID_B] });
});

test("host, location y dificultad solo se añaden cuando vienen informados", () => {
  const filtro = shopRepo.construirFiltroRuta({ hostId: ID_C, dificultad: "media" });

  assert.equal(filtro.hostId, ID_C);
  assert.equal(filtro.dificultad, "media");
  assert.equal(filtro.locationId, undefined);
});

test("getRutas compone portada, precio desde y paginación", async () => {
  let criteriosUsados;
  const resultado = await conRepo({
    idsDeSlugs: async () => ({ categoryId: [ID_A] }),
    buscarRutas: async ({ criterios, sort, page, limit }) => {
      criteriosUsados = { criterios, sort, page, limit };
      return {
        items: [
          { _id: ID_A, nombre: "Ruta A", coverImage: { url: "https://x/a-vieja.jpg", alt: "" } },
          { _id: ID_B, nombre: "Ruta B", coverImage: { url: "https://x/b.jpg", alt: "b" } }
        ],
        total: 25
      };
    },
    imagenesDeRutas: async () => [
      { entityId: ID_A, url: "https://x/a-nueva.jpg", alt: "a", position: 0 },
      { entityId: ID_A, url: "https://x/a-2.jpg", alt: "", position: 1 }
    ],
    preciosDesdeDeRutas: async () => [{ _id: ID_A, amount: 35, currency: "EUR" }]
  }, () => shopService.getRutas(listarRutasQuerySchema.parse({ q: "ruta", page: "2", categoria: "montana" })));

  assert.equal(criteriosUsados.page, 2);
  assert.equal(criteriosUsados.limit, 12);
  assert.equal(criteriosUsados.criterios.q, "ruta");
  assert.deepEqual(criteriosUsados.criterios.categoryId, [ID_A]);
  assert.equal(criteriosUsados.criterios.categoryMode, "any");

  assert.equal(resultado.total, 25);
  assert.equal(resultado.totalPages, 3);
  assert.deepEqual(resultado.data[0].coverImage, { url: "https://x/a-nueva.jpg", alt: "a" });
  assert.deepEqual(resultado.data[0].precioDesde, { amount: 35, currency: "EUR" });
  assert.equal(resultado.data[1].precioDesde, null);
  assert.deepEqual(resultado.data[1].coverImage, { url: "https://x/b.jpg", alt: "b" });
});

test("un slug que no existe devuelve listado vacío sin consultar rutas", async () => {
  let consultas = 0;
  const resultado = await conRepo({
    idsDeSlugs: async () => null,
    buscarRutas: async () => { consultas += 1; return { items: [], total: 0 }; }
  }, () => shopService.getRutas(listarRutasQuerySchema.parse({ categoria: "no-existe" })));

  assert.equal(consultas, 0);
  assert.deepEqual(resultado.data, []);
  assert.equal(resultado.total, 0);
});

test("getRutas sin resultados no consulta imágenes ni precios", async () => {
  let consultas = 0;
  const resultado = await conRepo({
    idsDeSlugs: async () => ({}),
    buscarRutas: async () => ({ items: [], total: 0 }),
    imagenesDeRutas: async () => { consultas += 1; return []; },
    preciosDesdeDeRutas: async () => { consultas += 1; return []; }
  }, () => shopService.getRutas(listarRutasQuerySchema.parse({})));

  assert.equal(consultas, 0);
  assert.deepEqual(resultado.data, []);
  assert.equal(resultado.totalPages, 0);
});

test("getHome devuelve categorías, hosts y locations con el límite indicado", async () => {
  const llamadas = [];
  const resultado = await conRepo({
    conteosHome: async (tipo, limite) => {
      llamadas.push([tipo, limite]);
      return [{ _id: ID_A, nombre: tipo, slug: tipo, total: 3 }];
    },
    imagenesDeEntidades: async () => []
  }, () => shopService.getHome(homeQuerySchema.parse({ limit: "5" })));

  assert.deepEqual(llamadas.map(([tipo]) => tipo).sort(), ["categories", "hosts", "locations"]);
  assert.ok(llamadas.every(([, limite]) => limite === 5));
  assert.equal(resultado.categories[0].total, 3);
});

test("home limita a 20 como máximo", () => {
  assert.equal(homeQuerySchema.safeParse({ limit: "21" }).success, false);
  assert.equal(homeQuerySchema.parse({}).limit, 10);
});

test("getRuta devuelve 404 si la ruta no es visible", async () => {
  await conRepo({ buscarRutaVisiblePorSlug: async () => null }, async () => {
    await assert.rejects(
      shopService.getRuta("ruta-oculta"),
      (error) => error.statusCode === 404
    );
  });
});

test("getRuta usa la imagen de la colección como portada y limita los campos de imagen", async () => {
  const ruta = await conRepo({
    buscarRutaVisiblePorSlug: async () => ({
      _id: ID_A,
      nombre: "Ruta",
      slug: "ruta",
      coverImage: { url: "https://x/vieja.jpg", alt: "" }
    }),
    imagenesDeRutas: async () => [
      { entityId: ID_A, url: "https://x/1.jpg", alt: "uno", position: 0 }
    ]
  }, () => shopService.getRuta("ruta"));

  assert.deepEqual(ruta.coverImage, { url: "https://x/1.jpg", alt: "uno" });
  assert.deepEqual(ruta.images, [{ url: "https://x/1.jpg", alt: "uno" }]);
});

test("getRuta adjunta la imagen de la localización y de cada categoría", async () => {
  const ruta = await conRepo({
    buscarRutaVisiblePorSlug: async () => ({
      _id: ID_A,
      nombre: "Ruta",
      slug: "ruta",
      coverImage: { url: "", alt: "" },
      locationId: { _id: ID_B, nombre: "Calpe", slug: "calpe" },
      categoryIds: [{ _id: ID_C, name: "Costeras", slug: "costeras" }]
    }),
    imagenesDeRutas: async () => [],
    imagenesDeEntidades: async (tipo, ids) => ids.map((id) => ({
      entityId: id,
      url: `https://x/${tipo}.jpg`,
      alt: tipo
    }))
  }, () => shopService.getRuta("ruta"));

  assert.deepEqual(ruta.locationId.imagen, { url: "https://x/location.jpg", alt: "location" });
  assert.deepEqual(ruta.categoryIds[0].imagen, { url: "https://x/categoria.jpg", alt: "categoria" });
});

test("getSalidas devuelve 404 si la ruta no es visible y valida el slug", async () => {
  await conRepo({ idDeRutaVisible: async () => null }, async () => {
    await assert.rejects(
      shopService.getSalidas("ruta-oculta"),
      (error) => error.statusCode === 404
    );
  });

  await assert.rejects(
    shopService.getSalidas("Slug Con Espacios"),
    (error) => error.statusCode === 400
  );
});

test("getSalidas devuelve las salidas públicas de la ruta", async () => {
  const salidas = await conRepo({
    idDeRutaVisible: async () => ({ _id: ID_A }),
    salidasPublicasDeRuta: async (rutaId) => [{ _id: ID_B, rutaId, stock: 4 }]
  }, () => shopService.getSalidas("ruta"));

  assert.equal(salidas[0].stock, 4);
});

test("getRelacionadas devuelve 404 si la ruta no es visible", async () => {
  await conRepo({ idDeRutaVisible: async () => null }, async () => {
    await assert.rejects(
      shopService.getRelacionadas("ruta-oculta"),
      (error) => error.statusCode === 404
    );
  });
});

test("getRelacionadas pasa localización y categorías de la ruta y enriquece el resultado", async () => {
  let relacion;
  const rutas = await conRepo({
    idDeRutaVisible: async () => ({ _id: ID_A, locationId: ID_B, categoryIds: [ID_C] }),
    rutasRelacionadas: async (ruta, limite) => {
      relacion = { ruta, limite };
      return [{ _id: ID_B, nombre: "Otra", coverImage: { url: "", alt: "" } }];
    },
    imagenesDeRutas: async () => [],
    preciosDesdeDeRutas: async () => []
  }, () => shopService.getRelacionadas("ruta"));

  assert.equal(relacion.ruta.locationId, ID_B);
  assert.equal(relacion.limite, 6);
  assert.equal(rutas[0].precioDesde, null);
});

test("getFiltros devuelve enums, orden y opciones completas sin límite", async () => {
  const pedidos = [];
  const resultado = await conRepo({
    opcionesFiltro: async (tipo) => {
      pedidos.push(tipo);
      return [{ _id: ID_B, nombre: tipo, slug: tipo, total: 1 }];
    },
    imagenesDeEntidades: async () => []
  }, () => shopService.getFiltros());

  assert.deepEqual(pedidos.sort(), ["categories", "hosts", "locations"]);
  assert.deepEqual(resultado.dificultades, ["facil", "media", "dificil"]);
  assert.deepEqual(resultado.categoryModes, ["any", "all"]);
  assert.ok(resultado.sort.includes("-nombre"));
  assert.ok(resultado.sort.includes("created_at"));
  assert.equal(resultado.hosts[0].total, 1);
});
