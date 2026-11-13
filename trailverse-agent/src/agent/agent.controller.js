const { responderChat } = require("./agent.service");

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

module.exports = { chat };
