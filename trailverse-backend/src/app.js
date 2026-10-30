require("dotenv").config();

const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const rutasRoutes = require("./routes/rutas.routes");
const categoriesRoutes = require("./routes/categories.routes");
const locationsRoutes = require("./routes/locations.routes");
const hostsRoutes = require("./routes/hosts.routes");
const usersRoutes = require("./routes/users.routes");
const departuresRoutes = require("./routes/departures.routes");
const rolesRoutes = require("./routes/roles.routes");
const authRoutes = require("./routes/auth.routes");
const profilesRoutes = require("./routes/profiles.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200", credentials: true }));
app.use(express.json());
app.use(cookieParser());
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
      locations: "/api/locations",
      categories: "/api/categories",
      hosts: "/api/hosts",
      users: "/api/users",
      departures: "/api/departures",
      roles: "/api/roles",
      auth: "/api/auth",
      profiles: "/api/profiles",
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
app.use("/api/categories", categoriesRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/hosts", hostsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/departures", departuresRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profilesRoutes);

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

  
