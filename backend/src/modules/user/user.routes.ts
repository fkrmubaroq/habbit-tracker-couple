import { Router } from "express";
import { updateProfile, getPartnerProfile } from "./user.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateProfileSchema } from "./user.schema.js";

const router = Router();

router.put("/profile", authMiddleware, validate(updateProfileSchema), updateProfile);
router.get("/partner", authMiddleware, getPartnerProfile);

export default router;
