import { CookieOptions, Response } from "express";
import { env } from "../../config/env.js";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

// Must mirror the options used when the shared "token" cookie was issued by the
// habit API, otherwise the browser keeps the original cookie.
function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
  };
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized: Token tidak valid atau tidak ditemukan" });
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar_emoji: user.avatar_emoji,
      avatar_image: user.avatar_image,
      role: user.role,
      partner_id: user.partner_id,
      theme_preferences: user.theme_preferences,
    },
  });
}

export async function logout(_req: AuthenticatedRequest, res: Response) {
  res.clearCookie("token", cookieOptions());
  return res.json({ message: "Logout successful" });
}
