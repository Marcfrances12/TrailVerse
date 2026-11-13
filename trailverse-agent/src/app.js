const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const agentRoutes = require("./agent/agent.router");
const { env } = require("./config/env");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.set("trust proxy", env.TRUST_PROXY);
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", servicio: "trailverse-agent" });
});

app.use("/api/agent", agentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
