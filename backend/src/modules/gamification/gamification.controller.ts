import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { gamificationRepo } from "../../repositories/repository.factory.js";

export async function getEarnedBadges(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const badges = await gamificationRepo.findEarnedBadges(userId);
    return res.json({ badges });
  } catch (err) {
    next(err);
  }
}

export async function getAllBadges(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const badges = await gamificationRepo.findAllBadges();
    return res.json({ badges });
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const user = req.user!;
    const partnerId = user.partner_id;

    // Calculate current week's Monday and Sunday dates
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const startDate = formatDate(monday);
    const endDate = formatDate(sunday);

    const leaderboard = await gamificationRepo.getLeaderboard(
      userId,
      partnerId,
      startDate,
      endDate
    );

    return res.json({
      leaderboard,
      weekRange: {
        startDate,
        endDate,
      },
    });
  } catch (err) {
    next(err);
  }
}
