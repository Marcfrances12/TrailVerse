const { env, validarEnv } = require("./config/env");
const connectDB = require("./config/database");
const app = require("./app");

async function main() {
  validarEnv();
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Agente TrailVerse escuchando en http://localhost:${env.PORT}`);
  });
}

main().catch((error) => {
  console.error("No se pudo iniciar el agente:", error.message);
  process.exit(1);
});
