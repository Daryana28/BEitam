// be\app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import modulesRouter from "./src/modules/index.js";
import errorHandler from "./src/middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());

// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 300,
//     standardHeaders: true,
//     legacyHeaders: false,
//   })
// );

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OK",
  });
});

app.use("/api", modulesRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;