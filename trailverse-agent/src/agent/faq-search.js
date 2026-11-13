const STOPWORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "que", "en", "y", "o",
  "por", "para", "con", "del", "al", "es", "son", "como", "donde", "cuando", "cual",
  "cuales", "hay", "se", "mi", "tu", "su", "si", "no", "puedo", "puede", "the", "and", "of"
]);

function tokens(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((termino) => termino.length >= 3 && !STOPWORDS.has(termino));
}

// Puntúa cada FAQ por coincidencias de palabras clave: pregunta > etiquetas > respuesta.
function buscarFaqs(faqs = [], consulta = "", limite = 3) {
  const terminos = new Set(tokens(consulta));
  if (terminos.size === 0) return [];

  return faqs
    .map((faq) => {
      const enPregunta = tokens(faq.pregunta);
      const enEtiquetas = (faq.tags ?? []).flatMap((etiqueta) => tokens(etiqueta));
      const enRespuesta = tokens(faq.respuesta);

      let puntos = 0;
      for (const termino of terminos) {
        if (enPregunta.includes(termino)) puntos += 3;
        if (enEtiquetas.includes(termino)) puntos += 2;
        if (enRespuesta.includes(termino)) puntos += 1;
      }

      return { faq, puntos };
    })
    .filter(({ puntos }) => puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, limite)
    .map(({ faq }) => ({
      pregunta: faq.pregunta,
      respuesta: String(faq.respuesta ?? "").slice(0, 600)
    }));
}

module.exports = { buscarFaqs, tokens };
