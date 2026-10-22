import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

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
