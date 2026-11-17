require("dotenv").config();

const env = {
  PORT: Number(process.env.PORT) || 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:4200",
  MONGODB_URI: process.env.MONGODB_URI,
  LLM_PROVIDER_BASE_URL: process.env.LLM_PROVIDER_BASE_URL || "https://api.groq.com/openai/v1",
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL || "qwen/qwen3.8-27b",
  LLM_FALLBACK_MODEL: process.env.LLM_FALLBACK_MODEL || "",
  LLM_RESPALDO_BASE_URL: process.env.LLM_RESPALDO_BASE_URL || "https://openrouter.ai/api/v1",
  LLM_RESPALDO_API_KEY: process.env.LLM_RESPALDO_API_KEY || "",
  LLM_RESPALDO_MODEL: process.env.LLM_RESPALDO_MODEL || "",
  FAQ_LLM_BASE_URL: process.env.FAQ_LLM_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/",
  FAQ_LLM_API_KEY: process.env.FAQ_LLM_API_KEY || "",
  FAQ_LLM_MODEL: process.env.FAQ_LLM_MODEL || "gemini-3.1-flash-lite",
  MONGODB_URI_ESCRITURA: process.env.MONGODB_URI_ESCRITURA || "",
  AGENT_RATE_LIMIT_MAX: Number(process.env.AGENT_RATE_LIMIT_MAX) || 30,
  AGENT_RATE_LIMIT_WINDOW_MS: Number(process.env.AGENT_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
  GUIA_RATE_LIMIT_MAX: Number(process.env.GUIA_RATE_LIMIT_MAX) || 60,
  GUIA_RATE_LIMIT_WINDOW_MS: Number(process.env.GUIA_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
  AGENT_TIMEOUT_MS: Number(process.env.AGENT_TIMEOUT_MS) || 30000,
  TRUST_PROXY: Number(process.env.TRUST_PROXY) || false,
  OVERPASS_URL: process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter",
  NOMINATIM_URL: process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org",
  GEO_USER_AGENT: process.env.GEO_USER_AGENT || "TrailVerse-Agent/1.0"
};

function validarEnv() {
  const faltan = ["MONGODB_URI", "LLM_API_KEY"].filter((clave) => !env[clave]);
  if (faltan.length > 0) {
    throw new Error(`Faltan variables de entorno: ${faltan.join(", ")}`);
  }
}

module.exports = { env, validarEnv };
