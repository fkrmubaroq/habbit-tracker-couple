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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import financeRoutes from "./modules/finance/finance.routes.js";

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "finance-tracker-api", database: "connected", timestamp: new Date().toISOString() });
});

// Finance routes
app.use("/api", financeRoutes);

// Error Handler
app.use(errorMiddleware);

export default app;
