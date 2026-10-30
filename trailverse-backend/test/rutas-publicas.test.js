const assert = require("node:assert/strict");
const test = require("node:test");
const rutasRepo = require("../src/repos/rutas.repo");
const imagenesService = require("../src/services/images.service");
const rutasService = require("../src/services/rutas.service");
const { optionalAuthenticate } = require("../src/middlewares/auth.middleware");

const ADMIN = { id: "65a000000000000000000001", role: "ADMIN" };
const USER = { id: "65a000000000000000000002", role: "USER" };

const RUTA_ACTIVA = {
  _id: "67a000000000000000000001",
  nombre: "Ruta activa",
  slug: "ruta-activa",
  isActive: true,
  locationId: null,
  hostId: {
    _id: "67b000000000000000000001",
    name: "Host",
    slug: "host",
    userId: { _id: "65c000000000000000000001", email: "secreto@test.com", roleId: "x" }
  },
  categoryIds: []
};

const RUTA_INACTIVA = { ...RUTA_ACTIVA, _id: "67a000000000000000000002", slug: "ruta-inactiva", isActive: false };

async function conRepo(mocks, ejecutar) {
  const originals = {
    getAll: rutasRepo.getAll,
    getBySlug: rutasRepo.getBySlug,
    obtenerImagenes: imagenesService.obtenerImagenes
  };
  Object.assign(rutasRepo, { getAll: mocks.getAll ?? originals.getAll, getBySlug: mocks.getBySlug ?? originals.getBySlug });
  imagenesService.obtenerImagenes = async () => [];
  try {
    return await ejecutar();
  } finally {
    Object.assign(rutasRepo, { getAll: originals.getAll, getBySlug: originals.getBySlug });
    imagenesService.obtenerImagenes = originals.obtenerImagenes;
  }
}

test("presentarPublica quita avisos de integridad y datos del usuario del host", () => {
  const publica = rutasService.presentarPublica({ ...RUTA_ACTIVA, dependencyWarnings: ["aviso"] });

  assert.equal(publica.dependencyWarnings, undefined);
  assert.deepEqual(publica.hostId, { _id: "67b000000000000000000001", name: "Host", slug: "host" });
  assert.equal(JSON.stringify(publica).includes("secreto@test.com"), false);
});

test("un visitante solo recibe rutas activas aunque pida las inactivas", async () => {
  let filtrosUsados;
  const resultado = await conRepo({
    getAll: async (filtros) => {
      filtrosUsados = filtros;
      return [RUTA_ACTIVA];
    }
  }, () => rutasService.getRutas({ isActive: "false" }, undefined));

  assert.equal(filtrosUsados.isActive, true);
  assert.equal(resultado[0].dependencyWarnings, undefined);
  assert.equal(resultado[0].hostId.userId, undefined);
});

test("un admin puede filtrar por inactivas y recibe avisos de integridad", async () => {
  let filtrosUsados;
  const resultado = await conRepo({
    getAll: async (filtros) => {
      filtrosUsados = filtros;
      return [RUTA_INACTIVA];
    }
  }, () => rutasService.getRutas({ isActive: false }, ADMIN));

  assert.equal(filtrosUsados.isActive, false);
  assert.ok(Array.isArray(resultado[0].dependencyWarnings));
});

test("un visitante recibe 404 al pedir por slug una ruta inactiva", async () => {
  await conRepo({ getBySlug: async () => RUTA_INACTIVA }, async () => {
    await assert.rejects(
      rutasService.getRutaBySlug("ruta-inactiva", undefined),
      (error) => error.statusCode === 404
    );
  });
});

test("un usuario USER tampoco ve rutas inactivas por slug", async () => {
  await conRepo({ getBySlug: async () => RUTA_INACTIVA }, async () => {
    await assert.rejects(
      rutasService.getRutaBySlug("ruta-inactiva", USER),
      (error) => error.statusCode === 404
    );
  });
});

test("un admin ve la ruta inactiva por slug con avisos", async () => {
  const ruta = await conRepo({ getBySlug: async () => RUTA_INACTIVA }, () =>
    rutasService.getRutaBySlug("ruta-inactiva", ADMIN)
  );

  assert.equal(ruta.isActive, false);
  assert.ok(Array.isArray(ruta.dependencyWarnings));
});

test("optionalAuthenticate deja pasar a visitantes sin token o con token inválido", () => {
  const casos = [undefined, "Bearer token-invalido"];

  for (const authorization of casos) {
    const req = { get: (nombre) => (nombre === "authorization" ? authorization : undefined) };
    let llamada;
    optionalAuthenticate(req, {}, (error) => {
      llamada = error;
    });
    assert.equal(llamada, undefined);
    assert.equal(req.user, undefined);
  }
});
