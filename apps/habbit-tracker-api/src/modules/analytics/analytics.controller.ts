import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { habitLogRepo, habitRepo, gamificationRepo } from "../../repositories/repository.factory.js";
import { Habit, HabitLog } from "../../types/index.js";

// Helper to format date
const formatDateStr = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to group Date into keys
function getPeriodKey(dateStr: string, period: "daily" | "weekly" | "monthly"): string {
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  
  if (period === "daily") {
    return dateStr;
  } else if (period === "weekly") {
    // Get ISO week number or Monday date of that week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return formatDateStr(monday);
  } else {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }
}

export async function getAnalytics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const user = req.user!;
    const partnerId = user.partner_id;

    const period = (req.query.period as "daily" | "weekly" | "monthly") || "daily";
    
    // Set default date ranges if not provided
    let { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    if (!startDate || !endDate) {
      const today = new Date();
      const end = new Date(today);
      const start = new Date(today);
      
      if (period === "daily") {
        start.setDate(today.getDate() - 30); // Last 30 days
      } else if (period === "weekly") {
        start.setDate(today.getDate() - 84); // Last 12 weeks
      } else {
        start.setMonth(today.getMonth() - 12); // Last 12 months
      }
      
      startDate = formatDateStr(start);
      endDate = formatDateStr(end);
    }

    // 1. Fetch habits and logs
    const userHabits = await habitRepo.findByUserId(userId);
    const userLogs = await habitLogRepo.findLogsForUser(userId, startDate, endDate);
    
    let partnerHabits: Habit[] = [];
    let partnerLogs: HabitLog[] = [];
    if (partnerId) {
      partnerHabits = await habitRepo.findByUserId(partnerId);
      partnerLogs = await habitLogRepo.findLogsForUser(partnerId, startDate, endDate);
    }

    // 2. Fetch streaks for user
    const userStreaks = await gamificationRepo.findUserStreaks(userId);
    const streakHistory = [];
    for (const streak of userStreaks) {
      const habit = userHabits.find(h => h.id === streak.habit_id);
      if (habit) {
        streakHistory.push({
          habitId: habit.id,
          title: habit.title,
          currentStreak: streak.current_streak,
          longestStreak: streak.longest_streak,
          iconEmoji: habit.icon_emoji,
        });
      }
    }



    // 4. Group logs by period to construct chart data
    const chartDataMap = new Map<string, { period: string; userCompleted: number; partnerCompleted: number }>();

    // Helper to initialize map keys
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = getPeriodKey(formatDateStr(d), period);
      if (!chartDataMap.has(key)) {
        chartDataMap.set(key, { period: key, userCompleted: 0, partnerCompleted: 0 });
      }
    }

    // Populate completed counts
    for (const log of userLogs) {
      if (log.is_completed) {
        const key = getPeriodKey(log.completed_date, period);
        if (chartDataMap.has(key)) {
          chartDataMap.get(key)!.userCompleted++;
        }
      }
    }

    for (const log of partnerLogs) {
      if (log.is_completed) {
        const key = getPeriodKey(log.completed_date, period);
        if (chartDataMap.has(key)) {
          chartDataMap.get(key)!.partnerCompleted++;
        }
      }
    }

    // Convert chart data map to list, calculating expected logs per period
    // Expected logs = active habits in that period * number of days in that period
    const chartData = Array.from(chartDataMap.values()).map(item => {
      // For rate calculations, let's keep it simple: return completion counts OR rates
      // In charts, we can either display total completed habits or percentage.
      // Recharts is easier with raw values, but rates are more informative.
      // Let's provide BOTH completed count and completion rate!
      const userActiveCount = userHabits.filter(h => h.is_active).length;
      const partnerActiveCount = partnerHabits.filter(h => h.is_active).length;

      // Rate is count divided by active habits count (avoiding division by 0)
      const userRate = userActiveCount > 0 ? (item.userCompleted / userActiveCount) * 100 : 0;
      const partnerRate = partnerActiveCount > 0 ? (item.partnerCompleted / partnerActiveCount) * 100 : 0;

      return {
        period: item.period,
        userCompletions: item.userCompleted,
        partnerCompletions: item.partnerCompleted,
        userRate: Math.round(Math.min(userRate, 100)),
        partnerRate: Math.round(Math.min(partnerRate, 100)),
      };
    }).sort((a, b) => a.period.localeCompare(b.period));

    // 5. Calculate overall metrics
    const userRateOverall = await habitLogRepo.getCompletionRate(userId, startDate, endDate);
    
    let partnerRateOverall = 0;
    if (partnerId) {
      partnerRateOverall = await habitLogRepo.getCompletionRate(partnerId, startDate, endDate);
    }

    return res.json({
      summary: {
        period,
        startDate,
        endDate,
        userCompletionRate: Math.round(userRateOverall * 100),
        partnerCompletionRate: Math.round(partnerRateOverall * 100),
        userTotalCompletions: userLogs.filter(log => log.is_completed).length,
        partnerTotalCompletions: partnerLogs.filter(log => log.is_completed).length,
      },
      chartData,
      streakHistory,
    });
  } catch (err) {
    next(err);
  }
}
