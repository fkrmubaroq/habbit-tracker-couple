import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorMiddleware } from "./middleware/error.middleware.js";
// Routes imports
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import gamificationRoutes from "./modules/gamification/gamification.routes.js";
import habitLogRoutes from "./modules/habit-log/habit-log.routes.js";
import habitRoutes from "./modules/habit/habit.routes.js";
import userRoutes from "./modules/user/user.routes.js";

dotenv.config();
const app = express();

// Security Middlewares
app.use(
  cors({
    origin: ["*"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parsers
app.use(express.json({ limit: "10mb" })); // Support base64 avatar uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/habit-logs", habitLogRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
