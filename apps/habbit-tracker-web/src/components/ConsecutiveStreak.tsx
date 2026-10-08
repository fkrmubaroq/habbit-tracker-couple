import dayjs from "dayjs";
import { AlertCircle, Flame } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useMyLogs } from "../hooks/use-habit-logs";
import { useMyHabits } from "../hooks/use-habits";
import { useAuthStore } from "../stores/auth.store";

export function ConsecutiveStreak() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: habits = [] } = useMyHabits();

  // Get date range for last 30 days
  const startDate = React.useMemo(() => dayjs().subtract(29, "day").format("YYYY-MM-DD"), []);
  const endDate = React.useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const { data: logs = [], isLoading } = useMyLogs(startDate, endDate);

  // Filter daily active habits for current user
  const myDailyHabits = React.useMemo(() => {
    return habits.filter(
      (h) => h.is_active && h.user_id === user?.id && h.frequency === "daily"
    );
  }, [habits, user]);

  // Map logs by date: dateString -> set of completed habit IDs
  const completionsByDate = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    logs.forEach((log) => {
      if (log.is_completed) {
        const dateStr = dayjs(log.completed_date).format("YYYY-MM-DD");
        if (!map.has(dateStr)) {
          map.set(dateStr, new Set());
        }
        map.get(dateStr)!.add(log.habit_id);
      }
    });
    return map;
  }, [logs]);

  // Check if a specific date was 100% completed
  const isDateFullyCompleted = React.useCallback(
    (dateStr: string) => {
      if (myDailyHabits.length === 0) return false;
      const completedSet = completionsByDate.get(dateStr);
      if (!completedSet) return false;

      // Every active daily habit must be in the completed set
      return myDailyHabits.every((habit) => completedSet.has(habit.id));
    },
    [myDailyHabits, completionsByDate]
  );

  // Calculate current streak
  const streakInfo = React.useMemo(() => {
    if (myDailyHabits.length === 0) {
      return { currentStreak: 0, todayCompleted: false };
    }

    const todayStr = dayjs().format("YYYY-MM-DD");
    const yesterdayStr = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    const todayCompleted = isDateFullyCompleted(todayStr);
    const yesterdayCompleted = isDateFullyCompleted(yesterdayStr);

    // If neither today nor yesterday is completed, streak is 0
    if (!todayCompleted && !yesterdayCompleted) {
      return { currentStreak: 0, todayCompleted: false };
    }

    // Determine the starting point for counting backwards
    let currentStreak = 0;
    let checkDate = todayCompleted ? dayjs() : dayjs().subtract(1, "day");

    // Count backwards until we hit a day that wasn't 100% completed
    while (true) {
      const checkDateStr = checkDate.format("YYYY-MM-DD");
      if (isDateFullyCompleted(checkDateStr)) {
        currentStreak++;
        checkDate = checkDate.subtract(1, "day");
      } else {
        break;
      }
    }

    return { currentStreak, todayCompleted };
  }, [myDailyHabits, isDateFullyCompleted]);

  // Generate last 7 days for the weekly calendar visualization
  const last7Days = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = dayjs().subtract(6 - index, "day");
      const dateStr = date.format("YYYY-MM-DD");
      return {
        dateStr,
        dayName: date.format("ddd"), // e.g. Mon, Tue
        dayNum: date.format("D"),
        isToday: dateStr === dayjs().format("YYYY-MM-DD"),
        isCompleted: isDateFullyCompleted(dateStr),
      };
    });
  }, [isDateFullyCompleted]);

  if (isLoading) {
    return (
      <div className="card-duo flex items-center justify-center p-6 h-[116px] bg-card-surface">
        <Flame className="h-6 w-6 text-primary animate-pulse mr-2" />
        <span className="text-xs font-bold text-text-secondary">{t("dashboard.loading")}</span>
      </div>
    );
  }

  // If there are no daily habits, show a friendly reminder
  if (myDailyHabits.length === 0) {
    return (
      <div className="card-duo flex items-center gap-3 p-4 bg-card-surface">
        <AlertCircle className="h-8 w-8 text-accent shrink-0" />
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-text-primary">
            {t("dashboard.streak_no_habits", { defaultValue: "No Daily Habits Active" })}
          </span>
          <span className="text-[10px] text-text-secondary font-semibold">
            {t("dashboard.streak_no_habits_desc", { defaultValue: "Create a daily daily habit to start tracking your streak!" })}
          </span>
        </div>
      </div>
    );
  }

  const { currentStreak, todayCompleted } = streakInfo;

  return (
    <div className="card-duo flex flex-col xl:flex-row items-center justify-between p-5 gap-4 bg-card-surface">
      {/* Streak Info */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center">
          <Flame
            className={`h-14 w-14 shrink-0 transition-all duration-300 ${currentStreak > 0
                ? "text-orange-500 fill-orange-500 animate-pulse drop-shadow-[0_4px_6px_rgba(249,115,22,0.3)]"
                : "text-text-secondary/30 fill-text-secondary/10"
              }`}
          />
          {currentStreak > 0 && (
            <span className="absolute text-xs font-black text-white mt-3 select-none">
              {currentStreak}
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-base font-black text-text-primary flex items-center gap-1.5">
            {currentStreak} {t("leaderboard.streaks", { defaultValue: "Day Streak" })}
            {todayCompleted && (
              <span className="text-[9px] bg-orange-500/10 text-orange-600 border border-orange-500/20 px-1.5 py-0.5 rounded-full font-black">
                {t("dashboard.today_done", { defaultValue: "TODAY DONE" })}
              </span>
            )}
          </span>
          <span className="text-[11px] text-text-secondary font-bold max-w-[200px] leading-tight mt-0.5">
            {todayCompleted
              ? t("dashboard.streak_kept", { defaultValue: "Awesome! You kept your streak alive today." })
              : currentStreak > 0
                ? t("dashboard.streak_pending", { defaultValue: "Complete all daily habits today to keep your streak!" })
                : t("dashboard.streak_start", { defaultValue: "Complete all daily habits today to start a streak!" })}
          </span>
        </div>
      </div>

      {/* 7-Day Calendar Grid */}
      <div className="flex flex-wrap items-center gap-2.5 bg-highlight/50 p-2.5 rounded-xl border border-border-color">
        {last7Days.map((day) => (
          <div
            key={day.dateStr}
            className={`flex flex-col items-center gap-1 p-1 w-11 rounded-lg transition-all ${day.isToday ? "bg-primary/10 border border-primary/20" : "border border-transparent"
              }`}
          >
            <span className="text-[9px] font-black text-text-secondary uppercase">
              {day.dayName.substring(0, 3)}
            </span>
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all font-black text-xs ${day.isCompleted
                  ? "bg-orange-500 border-orange-500 text-white shadow-[0_2px_0_0_#c2410c]"
                  : day.isToday
                    ? "border-primary/50 text-primary bg-card-surface"
                    : "border-text-secondary/20 text-text-secondary bg-transparent"
                }`}
            >
              {day.isCompleted ? (
                <Flame className="h-4 w-4 fill-white" />
              ) : (
                day.dayNum
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
