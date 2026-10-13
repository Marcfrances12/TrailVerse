require("dotenv").config();

const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const rutasRoutes = require("./routes/rutas.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

const logsDir = path.join(__dirname, 'logs');

  if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
  }

  const accessLogStream = fs.createWriteStream(
      path.join(logsDir, 'access.log'),
      { flags: 'a' }
  );

  app.use(morgan('combined', {
      stream: accessLogStream
  }));

app.get("/", (req, res) => {
  res.json({
    message: "API REST de rutas de senderismo",
    version: "1.0.0",
    endpoints: {
      rutas: "/api/rutas",
      health: "/api/health"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API funcionando correctamente"
  });
});

app.use("/api/rutas", rutasRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo iniciar la aplicación:", error.message);
    process.exit(1);
  });

  

