const { responderChat } = require("./agent.service");
const { obtenerGuia } = require("./guia.service");
const { obtenerValoracion } = require("./valoracion.service");
const { obtenerClienteLlm } = require("./agent.service");

// Respuesta en streaming SSE. Eventos: token, tool, done, error.
async function chat(req, res) {
  const cancelacion = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) cancelacion.abort();
  });

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const emit = (evento, datos) => {
    if (!res.writableEnded) {
      res.write(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`);
    }
  };

  await responderChat({ ...req.body, emit, signal: cancelacion.signal });
  res.end();
}

async function guia(req, res) {
  const datos = await obtenerGuia(req.params.id);
  if (!datos) {
    return res.status(404).json({ ok: false, error: "No hay ninguna ruta publicada con ese identificador" });
  }

  res.json({ ok: true, data: datos });
}

async function valoracion(req, res) {
  const datos = await obtenerValoracion(req.params.id, { llm: obtenerClienteLlm() });
  if (!datos) {
    return res.status(404).json({ ok: false, error: "No hay ninguna ruta publicada con ese identificador" });
  }

  res.json({ ok: true, data: datos });
}

module.exports = { chat, guia, valoracion };
