import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { userRepo } from "../../repositories/repository.factory.js";
import { mysqlPool, pgPool } from "../../config/database.js";
import { env } from "../../config/env.js";
import bcrypt from "bcryptjs";

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { name, avatar_emoji, avatar_image, theme_preferences, password } = req.body;

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

    // Optional password update
    if (password && password.trim() !== "") {
      user.password_hash = await bcrypt.hash(password, 10);
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

export async function resetData(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const user = req.user!;

    if (user.role !== "husband") {
      return res.status(403).json({ error: "Only the husband is authorized to reset couple activity data." });
    }

    const userIds = [userId];
    if (user.partner_id) {
      userIds.push(user.partner_id);
    }

    if (env.DB_PROVIDER === "mysql" && mysqlPool) {
      for (const uid of userIds) {
        await mysqlPool.query("DELETE FROM user_badges WHERE user_id = ?", [uid]);
        await mysqlPool.query("DELETE FROM streaks WHERE user_id = ?", [uid]);
        await mysqlPool.query("DELETE FROM habit_logs WHERE user_id = ?", [uid]);
        await mysqlPool.query("DELETE FROM habits WHERE user_id = ?", [uid]);
      }
    } else if (env.DB_PROVIDER === "supabase" && pgPool) {
      for (const uid of userIds) {
        await pgPool.query("DELETE FROM user_badges WHERE user_id = $1", [uid]);
        await pgPool.query("DELETE FROM streaks WHERE user_id = $1", [uid]);
        await pgPool.query("DELETE FROM habit_logs WHERE user_id = $1", [uid]);
        await pgPool.query("DELETE FROM habits WHERE user_id = $1", [uid]);
      }
    }

    return res.json({ message: "All habit data, logs, streaks, and badges have been reset successfully!" });
  } catch (err) {
    next(err);
  }
}

