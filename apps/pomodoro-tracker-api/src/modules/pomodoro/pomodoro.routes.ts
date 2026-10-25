import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createSession,
  getSettings,
  getStats,
  listSessions,
  updateSettings,
} from "./pomodoro.controller.js";
import {
  createSessionSchema,
  listSessionsQuerySchema,
  statsQuerySchema,
  updateSettingsSchema,
} from "./pomodoro.schema.js";

const router = Router();

router.use(authMiddleware);

router.get("/settings", getSettings);
router.put("/settings", validate(updateSettingsSchema), updateSettings);

router.post("/sessions", validate(createSessionSchema), createSession);
router.get("/sessions", validate(listSessionsQuerySchema), listSessions);

router.get("/stats", validate(statsQuerySchema), getStats);

export default router;
