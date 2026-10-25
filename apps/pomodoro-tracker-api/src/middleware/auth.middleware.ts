import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { executeQuery } from "../config/database.js";
import { env } from "../config/env.js";

export interface AuthenticatedUser {
  id: string;
  username: string;
  name: string;
  avatar_emoji: string | null;
  avatar_image: string | null;
  role: "husband" | "wife";
  partner_id: string | null;
  theme_preferences: unknown;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  partnerId?: string | null;
  user?: AuthenticatedUser;
}

/**
 * Verifies the shared "token" cookie issued by the habit app. The `users`
 * table is read-only from this service's point of view — pomodoro owns
 * `pomodoro_sessions` / `pomodoro_settings` only.
 *
 * `partner_id` is loaded because the session payload exposes it to the client,
 * but no pomodoro query uses it: this app is strictly personal.
 */
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

    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET) as any;
        if (payload && payload.userId) {
          const users = await executeQuery<AuthenticatedUser>(
            `SELECT id, username, name, avatar_emoji, avatar_image, role, partner_id, theme_preferences FROM users WHERE id = ? LIMIT 1`,
            [payload.userId]
          );

          if (users.length > 0) {
            req.userId = users[0].id;
            req.partnerId = users[0].partner_id;
            req.user = users[0];
            return next();
          }
        }
      } catch {
        // Token invalid, fall through to 401
      }
    }

    return res.status(401).json({ success: false, error: "Unauthorized: Token tidak valid atau tidak ditemukan" });
  } catch (err) {
    next(err);
  }
}
