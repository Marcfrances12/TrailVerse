class TTLCache {
  constructor({ ttlMs, maxEntries = 500 }) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entradas = new Map();
  }

  get(clave) {
    const entrada = this.entradas.get(clave);
    if (!entrada) return undefined;

    if (entrada.expira <= Date.now()) {
      this.entradas.delete(clave);
      return undefined;
    }

    return entrada.valor;
  }

  set(clave, valor) {
    if (this.entradas.size >= this.maxEntries && !this.entradas.has(clave)) {
      const primera = this.entradas.keys().next().value;
      this.entradas.delete(primera);
    }

    this.entradas.set(clave, { valor, expira: Date.now() + this.ttlMs });
  }
}

module.exports = { TTLCache };
