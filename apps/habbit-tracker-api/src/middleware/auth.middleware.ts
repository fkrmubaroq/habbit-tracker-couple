import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util.js";
import { userRepo } from "../repositories/repository.factory.js";
import { User } from "../types/index.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: User;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    let token = "";
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    const user = await userRepo.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.userId = payload.userId;
    req.user = user;
    next();
  } catch (err: any) {
    next(err);
  }
}
