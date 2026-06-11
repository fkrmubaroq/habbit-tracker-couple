import { Router } from "express";
import { getAnalytics } from "./analytics.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getAnalytics);

export default router;
