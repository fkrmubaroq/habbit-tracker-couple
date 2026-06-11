import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { userRepo } from "../../repositories/repository.factory.js";

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { name, avatar_emoji, avatar_image, theme_preferences } = req.body;

    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.name = name;
    user.avatar_emoji = avatar_emoji;
    
    // Only update avatar_image if provided (or null to clear it)
    if (avatar_image !== undefined) {
      user.avatar_image = avatar_image;
    }
    
    if (theme_preferences !== undefined) {
      user.theme_preferences = theme_preferences;
    }

    const updatedUser = await userRepo.update(user);

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        avatar_emoji: updatedUser.avatar_emoji,
        avatar_image: updatedUser.avatar_image,
        role: updatedUser.role,
        partner_id: updatedUser.partner_id,
        theme_preferences: updatedUser.theme_preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPartnerProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;
    if (!user.partner_id) {
      return res.status(404).json({ error: "Partner not linked yet" });
    }

    const partner = await userRepo.findById(user.partner_id);
    if (!partner) {
      return res.status(404).json({ error: "Partner profile not found" });
    }

    return res.json({
      partner: {
        id: partner.id,
        username: partner.username,
        name: partner.name,
        avatar_emoji: partner.avatar_emoji,
        avatar_image: partner.avatar_image,
        role: partner.role,
      },
    });
  } catch (err) {
    next(err);
  }
}
