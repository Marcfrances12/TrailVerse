const { z } = require("zod");

const MAX_INTENTOS = 2;

const faqGeneradaSchema = z.object({
  faqs: z
    .array(
      z.object({
        pregunta: z.string().trim().min(5).max(150),
        respuesta: z.string().trim().min(10).max(500),
        tags: z.array(z.string().trim().min(2).max(30)).max(4).default([])
      })
    )
    .min(3)
    .max(6)
});

const INSTRUCCIONES = `Eres el redactor de preguntas frecuentes de TrailVerse, una web de rutas de senderismo.
Genera entre 4 y 6 preguntas frecuentes para la ruta que te describe el usuario.

REGLAS
1. Usa solo los datos de la ruta que recibes. Si un dato no aparece, no lo afirmes.
2. Para temas que los datos no cubren (agua, perros, transporte, aparcamiento, material), da consejos generales y formúlalos como recomendación ("Lleva agua suficiente", "Consulta antes si hay fuentes"). No afirmes que existan fuentes, horarios, precios, teléfonos ni nombres de sitios.
3. Preguntas cortas y útiles para alguien que planea la ruta: dificultad, duración, desnivel, nivel necesario, qué llevar, si es apta para niños o perros, en qué época es mejor.
4. Respuestas en español, claras, de 1 a 3 frases.
5. "tags": de 1 a 4 palabras clave en minúsculas, sin acentos cuando sea posible (por ejemplo "agua", "familias", "dificultad").

Responde únicamente con JSON con esta forma:
{"faqs":[{"pregunta":"...","respuesta":"...","tags":["..."]}]}`;

function descripcionDeRuta(ruta) {
  return JSON.stringify(
    {
      nombre: ruta.nombre,
      descripcion: ruta.descripcion,
      dificultad: ruta.dificultad,
      distanciaKm: ruta.distanciaKm,
      desnivelM: ruta.desnivelM,
      duracionHoras: ruta.duracionHoras,
      circular: Boolean(ruta.circular),
      ubicacion: ruta.locationId
        ? {
            nombre: ruta.locationId.nombre,
            provincia: ruta.locationId.provincia,
            comunidad: ruta.locationId.comunidad
          }
        : null
    },
    null,
    2
  );
}

function construirMensajes(ruta, correccion) {
  const mensajes = [
    { role: "system", content: INSTRUCCIONES },
    { role: "user", content: `Ruta:\n${descripcionDeRuta(ruta)}` }
  ];

  if (correccion) {
    mensajes.push({
      role: "user",
      content: `Tu respuesta anterior no era válida: ${correccion}. Responde de nuevo solo con el JSON pedido.`
    });
  }

  return mensajes;
}

// Pide las FAQs al modelo y valida la respuesta. Reintenta una vez si el JSON o el esquema no son válidos.
async function generarFaqs(ruta, { llm, model }) {
  let correccion = null;
  let ultimoError = null;

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const respuesta = await llm.chat.completions.create({
      model,
      messages: construirMensajes(ruta, correccion),
      temperature: 0.3,
      reasoning_effort: "low",
      response_format: { type: "json_object" }
    });

    const contenido = respuesta.choices?.[0]?.message?.content ?? "";

    try {
      const datos = faqGeneradaSchema.parse(JSON.parse(contenido));
      return datos.faqs;
    } catch (error) {
      ultimoError = error;
      correccion = error instanceof SyntaxError ? "no es JSON válido" : "no cumple el formato de faqs";
    }
  }

  throw new Error(`El modelo no devolvió FAQs válidas: ${ultimoError?.message ?? "respuesta vacía"}`);
}

module.exports = { generarFaqs, faqGeneradaSchema, construirMensajes };
