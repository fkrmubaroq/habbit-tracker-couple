import { Router } from "express";
import {
  createHabit,
  updateHabit,
  deleteHabit,
  getMyHabits,
  getPartnerHabits,
  getHabitTemplates,
} from "./habit.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createHabitSchema,
  updateHabitSchema,
  habitIdParamSchema,
} from "./habit.schema.js";

const router = Router();

router.get("/templates", getHabitTemplates);
router.get("/me", authMiddleware, getMyHabits);
router.get("/partner", authMiddleware, getPartnerHabits);
router.post("/", authMiddleware, validate(createHabitSchema), createHabit);
router.put("/:id", authMiddleware, validate(updateHabitSchema), updateHabit);
router.delete("/:id", authMiddleware, validate(habitIdParamSchema), deleteHabit);

export default router;
