import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectCloudinary from "./src/config/cloudinary.conf.js";
import connectDB from "./src/config/db.conf.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import logger from "./src/middlewares/logger.js";
import routes from "./src/routes/index.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./src/config/swagger.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Lista de origenes permitidos para CORS (soporta una o varias URLs separadas por coma)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin origen (como Postman, apps moviles o llamadas servidor-a-servidor)
      // o si el origen esta en la lista permitida / comodin '*'
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error(`Bloqueado por CORS: origen ${origin} no permitido`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(logger);

connectDB();
connectCloudinary();

app.get("/", (req, res) => {
  res.send("API Ecommerce con MongoDB");
});

app.use("/api", routes);

// Swagger solo se habilita en entornos que no sean produccion
if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method, // GET / POST / PUT ...
    url: req.originalUrl, // http://localhost:4000/...
  });
});

// El manejador de errores debe registrarse AL FINAL, despues de las rutas:
// Express solo lo invoca para los next(error) de middlewares declarados antes.
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`Swagger docs available on http://localhost:${port}/api-docs`);
  }
});
