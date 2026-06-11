import { Router } from "express";
import { toggleCompletion, getLogs, getPartnerLogs } from "./habit-log.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { toggleLogSchema, getLogsSchema } from "./habit-log.schema.js";

const router = Router();

router.post("/toggle", authMiddleware, validate(toggleLogSchema), toggleCompletion);
router.get("/me", authMiddleware, validate(getLogsSchema), getLogs);
router.get("/partner", authMiddleware, validate(getLogsSchema), getPartnerLogs);

export default router;
