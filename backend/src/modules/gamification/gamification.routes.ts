import { Router } from "express";
import { getEarnedBadges, getAllBadges, getLeaderboard } from "./gamification.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/badges", authMiddleware, getAllBadges);
router.get("/badges/earned", authMiddleware, getEarnedBadges);
router.get("/leaderboard", authMiddleware, getLeaderboard);

export default router;
