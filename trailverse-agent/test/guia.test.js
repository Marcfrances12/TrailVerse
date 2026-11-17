const { test } = require("node:test");
const assert = require("node:assert/strict");

const { construirConsultaUnion, agruparLugaresPorCategoria } = require("../src/agent/geo.client");
const { CATEGORIAS_GUIA, instruccionesResumen } = require("../src/agent/guia-generator");
const { consejosDeRuta } = require("../src/agent/guia.service");

const LAT = 38.8208;
const LNG = -0.6065;

test("construirConsultaUnion pide todas las categorías en una sola consulta con el radio máximo", () => {
  const consulta = construirConsultaUnion(["restaurant", "parking"], LAT, LNG, 2000, 60);
  assert.match(consulta, /\[timeout:60\]/);
  assert.match(consulta, /nwr\(around:2000,38\.8208,-0\.6065\)\["amenity"~"\^\(restaurant\|cafe\|bar\|pub\)\$"\]/);
  assert.match(consulta, /\["amenity"="parking"\]/);
  assert.equal((consulta.match(/nwr\(/g) ?? []).length, 2);
});

test("agruparLugaresPorCategoria reparte los elementos por etiquetas y radio", () => {
  const elementos = [
    { lat: LAT + 0.001, lon: LNG, tags: { amenity: "restaurant", name: "Mesón" } },
    { lat: LAT + 0.002, lon: LNG, tags: { amenity: "parking" } },
    { center: { lat: LAT + 0.01, lon: LNG }, tags: { tourism: "hostel", name: "Albergue lejano" } },
    { lat: LAT, lon: LNG, tags: { highway: "footway" } }
  ];

  const grupos = agruparLugaresPorCategoria(elementos, LAT, LNG, [
    { categoria: "restaurant", radioM: 2000 },
    { categoria: "parking", radioM: 2000 },
    { categoria: "lodging", radioM: 500 }
  ]);

  assert.equal(grupos.restaurant.length, 1);
  assert.equal(grupos.restaurant[0].nombre, "Mesón");
  assert.equal(grupos.parking.length, 1);
  assert.equal(grupos.parking[0].nombre, null);
  assert.deepEqual(grupos.lodging, []);
});

test("agruparLugaresPorCategoria quita duplicados con el mismo nombre y tipo", () => {
  const elementos = [
    { lat: LAT + 0.001, lon: LNG, tags: { amenity: "bar", name: "Bar Centro" } },
    { lat: LAT + 0.0012, lon: LNG, tags: { amenity: "bar", name: "Bar Centro" } }
  ];

  const grupos = agruparLugaresPorCategoria(elementos, LAT, LNG, [{ categoria: "restaurant", radioM: 2000 }]);
  assert.equal(grupos.restaurant.length, 1);
});

test("las categorías de la guía coinciden con las que usa el chat", () => {
  assert.deepEqual(
    CATEGORIAS_GUIA.map((c) => c.categoria),
    ["restaurant", "lodging", "transport", "parking"]
  );
});

test("el resumen de la guía solo puede usar los datos recibidos", () => {
  assert.match(instruccionesResumen(), /Usa solo los nombres y distancias de la lista/);
});

test("consejosDeRuta recorta respuestas largas y conserva la pregunta", () => {
  const consejos = consejosDeRuta({
    faqs: [{ pregunta: "¿Hay agua?", respuesta: "a".repeat(900) }]
  });
  assert.equal(consejos[0].pregunta, "¿Hay agua?");
  assert.equal(consejos[0].respuesta.length, 600);
});
