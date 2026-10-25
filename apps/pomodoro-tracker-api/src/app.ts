import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// Security & CORS
app.use(
  cors({
    origin: env.ALLOW_ORIGIN_CORS
      ? env.ALLOW_ORIGIN_CORS.split(",").map((o: string) => o.trim())
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import authRoutes from "./modules/auth/auth.routes.js";
import pomodoroRoutes from "./modules/pomodoro/pomodoro.routes.js";

// Health Check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "pomodoro-tracker-api",
    timestamp: new Date().toISOString(),
  });
});

// Shared session (read-only) — session itself is issued by habbit-tracker-api
app.use("/api/auth", authRoutes);

// Pomodoro routes
app.use("/api/pomodoro", pomodoroRoutes);

// Error Handler
app.use(errorMiddleware);

export default app;
