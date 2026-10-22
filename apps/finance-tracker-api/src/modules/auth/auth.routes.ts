import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { me } from "./auth.controller.js";

const router = Router();

router.get("/me", authMiddleware, (req, res) => me(req, res));

export default router;
