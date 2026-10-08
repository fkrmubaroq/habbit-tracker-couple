import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { habitLogRepo, habitRepo, gamificationRepo } from "../../repositories/repository.factory.js";
import { HabitLog, Streak, Badge } from "../../types/index.js";

// Helper to calculate streaks based on completions history
async function updateHabitStreak(
  userId: string,
  habitId: string,
  frequency: "daily" | "weekly" | "monthly"
): Promise<Streak> {
  // 1. Fetch all completed logs for this habit (sorted by completed_date ASC)
  const logs = await habitLogRepo.findLogsForHabit(habitId, "1970-01-01", "2999-12-31");
  const completedDates = logs
    .filter(log => log.is_completed && log.user_id === userId)
    .map(log => new Date(log.completed_date))
    .sort((a, b) => a.getTime() - b.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let lastCompletedDate: string | null = null;

  if (completedDates.length > 0) {
    // Determine allowed gap based on frequency
    let maxGapMs = 24 * 60 * 60 * 1000; // default daily: 24h + 24h grace = 48h
    if (frequency === "daily") {
      maxGapMs = 2 * 24 * 60 * 60 * 1000; // 48h (today and yesterday)
    } else if (frequency === "weekly") {
      maxGapMs = 14 * 24 * 60 * 60 * 1000; // 14 days
    } else if (frequency === "monthly") {
      maxGapMs = 62 * 24 * 60 * 60 * 1000; // 62 days
    }

    // Sort completed dates descending for current streak calculation
    const descDates = [...completedDates].sort((a, b) => b.getTime() - a.getTime());
    
    // Check if the latest completed date is within the allowed gap from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const latestLogDate = descDates[0];
    const diffFromToday = today.getTime() - latestLogDate.getTime();

    if (diffFromToday <= maxGapMs) {
      // Habit is still in streak. Count back.
      currentStreak = 1;
      let prevDate = latestLogDate;
      for (let i = 1; i < descDates.length; i++) {
        const currentDate = descDates[i];
        const gap = prevDate.getTime() - currentDate.getTime();
        
        // Allowed step for increment
        let expectedStep = 24 * 60 * 60 * 1000;
        if (frequency === "daily") expectedStep = 1.5 * 24 * 60 * 60 * 1000;
        else if (frequency === "weekly") expectedStep = 8 * 24 * 60 * 60 * 1000;
        else if (frequency === "monthly") expectedStep = 32 * 24 * 60 * 60 * 1000;


        if (gap <= expectedStep) {
          currentStreak++;
          prevDate = currentDate;
        } else {
          break;
        }
      }
    } else {
      // Streak broken
      currentStreak = 0;
    }

    // Longest streak calculation (ascending scan)
    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < completedDates.length; i++) {
      const prevDate = completedDates[i - 1];
      const currentDate = completedDates[i];
      const gap = currentDate.getTime() - prevDate.getTime();

      let expectedStep = 24 * 60 * 60 * 1000;
      if (frequency === "daily") expectedStep = 1.5 * 24 * 60 * 60 * 1000;
      else if (frequency === "weekly") expectedStep = 8 * 24 * 60 * 60 * 1000;
      else if (frequency === "monthly") expectedStep = 32 * 24 * 60 * 60 * 1000;


      if (gap <= expectedStep) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 1;
      }
    }

    // Format last completed date
    const lastD = descDates[0];
    const yyyy = lastD.getFullYear();
    const mm = String(lastD.getMonth() + 1).padStart(2, "0");
    const dd = String(lastD.getDate()).padStart(2, "0");
    lastCompletedDate = `${yyyy}-${mm}-${dd}`;
  }

  // Find existing streak record
  let existingStreak = await gamificationRepo.findStreak(userId, habitId);
  const updatedStreak: Streak = {
    id: existingStreak ? existingStreak.id : uuidv4(),
    user_id: userId,
    habit_id: habitId,
    current_streak: currentStreak,
    longest_streak: Math.max(longestStreak, existingStreak ? existingStreak.longest_streak : 0),
    last_completed_date: lastCompletedDate,
  };

  await gamificationRepo.upsertStreak(updatedStreak);
  return updatedStreak;
}

// Helper to check and unlock badges based on streaks and completion counts
async function checkBadgeUnlocks(userId: string): Promise<Badge[]> {
  const unlockedBadges: Badge[] = [];
  try {
    // 1. Fetch user's streaks
    const streaks = await gamificationRepo.findUserStreaks(userId);
    const maxStreak = streaks.reduce((max, s) => Math.max(max, s.current_streak), 0);

    // 2. Fetch user's completions count
    const logs = await habitLogRepo.findLogsForUser(userId, "1970-01-01", "2999-12-31");
    const completedCount = logs.filter(log => log.is_completed).length;

    // 3. Fetch all badges
    const allBadges = await gamificationRepo.findAllBadges();
    const earnedBadges = await gamificationRepo.findEarnedBadges(userId);
    const earnedIds = new Set(earnedBadges.map(b => b.id));

    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue;

      let meetsRequirement = false;

      // Personal streak badge
      if (badge.name.includes("7 Day Streak") && maxStreak >= 7) {
        meetsRequirement = true;
      } else if (badge.name.includes("30 Day Consistency") && maxStreak >= 30) {
        meetsRequirement = true;
      } 
      // Personal total completion badge or Couple completion badge
      else if (badge.name.includes("100 Together") && completedCount >= 100) {
        // In a real couple environment, this would check the sum of completions, let's keep it simple
        meetsRequirement = true;
      } else if (badge.name.includes("First Month") && completedCount >= 30) {
        meetsRequirement = true;
      }

      if (meetsRequirement) {
        const success = await gamificationRepo.awardBadge(userId, badge.id);
        if (success) {
          unlockedBadges.push(badge);
        }
      }
    }
  } catch (err) {
    console.error("Error checking badge unlocks:", err);
  }
  return unlockedBadges;
}

export async function toggleCompletion(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { habit_id, completed_date, is_completed, notes } = req.body;

    const habit = await habitRepo.findById(habit_id);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }

    // Let couple members log shared habits, but restrict personal habits
    if (!habit.is_shared && habit.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized: You cannot log this personal habit" });
    }

    let log: HabitLog;

    if (is_completed) {
      // 1. Create completion log
      const logId = uuidv4();
      const newLog: HabitLog = {
        id: logId,
        habit_id,
        user_id: userId,
        completed_date,
        is_completed: true,
        notes: notes || null,
      };
      log = await habitLogRepo.create(newLog);
    } else {
      // 2. Delete completion log
      const existingLog = await habitLogRepo.findByHabitAndDate(habit_id, completed_date);
      if (existingLog) {
        await habitLogRepo.delete(habit_id, completed_date);
      }
      log = {
        id: existingLog ? existingLog.id : "",
        habit_id,
        user_id: userId,
        completed_date,
        is_completed: false,
        notes: null,
      };
    }

    // 3. Recalculate streak for this habit
    const streak = await updateHabitStreak(userId, habit_id, habit.frequency);

    // 4. Check badge unlocks if completed
    let newBadges: Badge[] = [];
    if (is_completed) {
      newBadges = await checkBadgeUnlocks(userId);
    }

    return res.json({
      message: is_completed ? "Habit marked completed" : "Habit completion removed",
      log,
      streak,
      unlockedBadges: newBadges,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLogs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };

    const logs = await habitLogRepo.findLogsForUser(userId, startDate, endDate);
    return res.json({ logs });
  } catch (err) {
    next(err);
  }
}

export async function getPartnerLogs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };

    if (!user.partner_id) {
      return res.json({ logs: [] });
    }

    const logs = await habitLogRepo.findLogsForUser(user.partner_id, startDate, endDate);
    return res.json({ logs });
  } catch (err) {
    next(err);
  }
}
