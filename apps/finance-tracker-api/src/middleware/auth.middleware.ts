import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { executeQuery } from "../config/database.js";

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: "husband" | "wife";
  partner_id: string | null;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  partnerId?: string | null;
  user?: AuthenticatedUser;
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

    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET) as any;
        if (payload && payload.userId) {
          const users = await executeQuery<any>(
            `SELECT id, name, role, partner_id FROM users WHERE id = ? LIMIT 1`,
            [payload.userId]
          );

          if (users.length > 0) {
            req.userId = users[0].id;
            req.partnerId = users[0].partner_id;
            req.user = users[0];
            return next();
          }
        }
      } catch (tokenErr) {
        // Token invalid, fall through
      }
    }

    // In local development: fallback to first user in DB if exists, or a default couple user
    if (env.NODE_ENV === "development") {
      try {
        const users = await executeQuery<any>(
          `SELECT id, name, role, partner_id FROM users ORDER BY created_at ASC LIMIT 1`
        );
        if (users.length > 0) {
          req.userId = users[0].id;
          req.partnerId = users[0].partner_id;
          req.user = users[0];
          return next();
        }
      } catch (dbErr) {
        // DB not available or empty
      }

      // Default mock user for standalone finance tracker dev
      req.userId = "dev-user-001";
      req.partnerId = "dev-user-002";
      req.user = {
        id: "dev-user-001",
        name: "Fikri",
        role: "husband",
        partner_id: "dev-user-002",
      };
      return next();
    }

    return res.status(401).json({ success: false, error: "Unauthorized: Token tidak valid atau tidak ditemukan" });
  } catch (err) {
    next(err);
  }
}
