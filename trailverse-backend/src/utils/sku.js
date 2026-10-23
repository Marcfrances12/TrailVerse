function primerasLetras(texto) {
  const letras = String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/gi, "")
    .toUpperCase();

  if (!letras) {
    throw new TypeError("No se puede generar un SKU sin letras en sus datos");
  }

  return letras.slice(0, 3);
}

function formatearDistancia(distanciaKm) {
  const distancia = Number(distanciaKm);
  if (!Number.isFinite(distancia) || distancia < 0) {
    throw new TypeError("La distancia del SKU debe ser un número no negativo");
  }

  return new Intl.NumberFormat("es-ES", {
    useGrouping: false,
    maximumFractionDigits: 1
  }).format(distancia);
}


function generateSku({ nombreLocalizacion, provincia, dificultad, distanciaKm }) {
  return `${primerasLetras(nombreLocalizacion)}${primerasLetras(provincia)}-${primerasLetras(dificultad)}-${formatearDistancia(distanciaKm)}`;
}

function generateSkuWithSequence(base, numero) {
  if (!Number.isInteger(numero) || numero < 1) {
    throw new TypeError("La secuencia del SKU debe ser un entero positivo");
  }
  return `${base}-${String(numero).padStart(3, "0")}`;
}

module.exports = { generateSku, generateSkuWithSequence };
