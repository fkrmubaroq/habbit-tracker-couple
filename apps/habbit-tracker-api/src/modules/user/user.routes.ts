import { Router } from "express";
import { updateProfile, getPartnerProfile, resetData } from "./user.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateProfileSchema } from "./user.schema.js";

const router = Router();

router.put("/profile", authMiddleware, validate(updateProfileSchema), updateProfile);
router.get("/partner", authMiddleware, getPartnerProfile);
router.delete("/reset-data", authMiddleware, resetData);

export default router;
