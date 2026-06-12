import dayjs from "dayjs";
import { Award, Heart } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useMyLogs, usePartnerLogs } from "../../hooks/use-habit-logs";
import { useMyHabits, usePartnerHabits } from "../../hooks/use-habits";
import { usePartnerProfile } from "../../hooks/use-partner";
import { useAuthStore } from "../../stores/auth.store";

export function ActivitySummarySection() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: partner } = usePartnerProfile();

  const [activeTab, setActiveTab] = React.useState<"me" | "partner">("me");

  const currentYear = React.useMemo(() => dayjs().year(), []);
  const startDate = React.useMemo(() => `${currentYear}-01-01`, [currentYear]);
  const endDate = React.useMemo(() => `${currentYear}-12-31`, [currentYear]);

  // Fetch habits & logs
  const { data: myHabits = [] } = useMyHabits();
  const { data: partnerHabits = [] } = usePartnerHabits();
  const { data: myLogs = [], isLoading: myLogsLoading } = useMyLogs(startDate, endDate);
  const { data: partnerLogs = [], isLoading: partnerLogsLoading } = usePartnerLogs(startDate, endDate);

  // Switch context data based on selected tab
  const targetUser = activeTab === "me" ? user : partner;
  const targetHabits = activeTab === "me" ? myHabits : partnerHabits;
  const targetLogs = activeTab === "me" ? myLogs : partnerLogs;
  const isLoading = activeTab === "me" ? myLogsLoading : partnerLogsLoading;

  // Streak & completions calculations
  const stats = React.useMemo(() => {
    if (!targetUser) return { totalCompletions: 0, streak: 0, dailyHabitsCount: 0 };

    // 1. Total completions in current calendar year
    const totalCompletions = targetLogs.filter((log) => log.is_completed).length;

    // 2. Filter daily active habits for target user
    const dailyHabits = targetHabits.filter(
      (h) => h.is_active && h.user_id === targetUser.id && h.frequency === "daily"
    );

    // Map logs by date: dateString -> set of completed habit IDs
    const completionsByDate = new Map<string, Set<string>>();
    targetLogs.forEach((log) => {
      if (log.is_completed) {
        const dateStr = dayjs(log.completed_date).format("YYYY-MM-DD");
        if (!completionsByDate.has(dateStr)) {
          completionsByDate.set(dateStr, new Set());
        }
        completionsByDate.get(dateStr)!.add(log.habit_id);
      }
    });

    // Check if a specific date was 100% completed
    const isDateFullyCompleted = (dateStr: string) => {
      if (dailyHabits.length === 0) return false;
      const completedSet = completionsByDate.get(dateStr);
      if (!completedSet) return false;
      return dailyHabits.every((habit) => completedSet.has(habit.id));
    };

    // Calculate current streak
    let streak = 0;
    if (dailyHabits.length > 0) {
      const todayStr = dayjs().format("YYYY-MM-DD");
      const yesterdayStr = dayjs().subtract(1, "day").format("YYYY-MM-DD");

      const todayCompleted = isDateFullyCompleted(todayStr);
      const yesterdayCompleted = isDateFullyCompleted(yesterdayStr);

      if (todayCompleted || yesterdayCompleted) {
        let checkDate = todayCompleted ? dayjs() : dayjs().subtract(1, "day");
        while (true) {
          const checkDateStr = checkDate.format("YYYY-MM-DD");
          if (isDateFullyCompleted(checkDateStr)) {
            streak++;
            checkDate = checkDate.subtract(1, "day");
          } else {
            break;
          }
        }
      }
    }

    return { totalCompletions, streak, dailyHabitsCount: dailyHabits.length };
  }, [targetUser, targetHabits, targetLogs]);

  return (
    <div className="card-duo p-5 md:p-6 flex flex-col gap-6 w-full">
      {/* Header controls & tabs switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-highlight pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
            <Award className="h-5.5 w-5.5 text-primary" />
            <span>{t("activity.summary_title")}</span>
          </h2>
        </div>

        {/* Tab switchers */}
        <div className="tabs-duo-container self-start sm:self-center">
          <button
            onClick={() => setActiveTab("me")}
            className={`tab-duo-btn ${activeTab === "me" ? "active" : ""}`}
          >
            {t("activity.user_me")}
          </button>
          <button
            onClick={() => setActiveTab("partner")}
            className={`tab-duo-btn ${activeTab === "partner" ? "active" : ""}`}
          >
            {partner?.name || t("activity.user_partner")}
          </button>
        </div>
      </div>

      {/* Main content display card */}
      {activeTab === "partner" && !partner ? (
        <div className="flex flex-col items-center justify-center p-8 bg-highlight/30 border-2 border-dashed border-border-color rounded-2xl text-center">
          <span className="text-4xl animate-bounce">🦖</span>
          <p className="font-extrabold text-sm text-text-primary mt-3">
            {t("leaderboard.waiting_partner")}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Heart className="h-8 w-8 text-primary animate-bounce fill-current" />
          <span className="text-xs font-bold text-text-secondary">{t("common.loading")}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* Avatar Profile Section */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full border-4 border-primary/30 flex items-center justify-center bg-highlight shadow-md overflow-hidden hover:scale-105 transition-all duration-300">
              {targetUser?.avatar_image ? (
                <img
                  src={targetUser.avatar_image}
                  alt={targetUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl select-none">{targetUser?.avatar_emoji}</span>
              )}
            </div>

            <div className="text-center mt-3.5">
              <h3 className="text-lg font-black text-text-primary">{targetUser?.name}</h3>
              <span
                className={`inline-block mt-1.5 text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${targetUser?.role === "husband"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-pink-500/10 text-pink-600 border-pink-500/20"
                  }`}
              >
                {targetUser?.role === "husband" ? t("common.husband") : t("common.wife")}
              </span>
            </div>
          </div>

          {/* Stats Display Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
            {/* Box 1: Total Activity */}
            <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-highlight hover:-translate-y-0.5">
              <span className="text-3xl bg-primary/20 text-primary p-3 rounded-2xl border border-primary/25 shrink-0 select-none">
                🏆
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">
                  {t("activity.total_year_activity")}
                </span>
                <span className="text-2xl font-black text-text-primary mt-1">
                  {stats.totalCompletions}
                </span>
                <span className="text-[10px] font-bold text-text-secondary mt-0.5">
                  {t("activity.completed_in_year", { year: currentYear })}
                </span>
              </div>
            </div>

            {/* Box 2: Perfect Streak */}
            <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-highlight hover:-translate-y-0.5">
              <span className="text-3xl bg-accent/20 text-accent p-3 rounded-2xl border border-accent/25 shrink-0 select-none animate-pulse">
                🔥
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">
                  {t("activity.perfect_streak")}
                </span>
                <span className="text-2xl font-black text-text-primary mt-1">
                  {t("activity.days_value", { count: stats.streak })}
                </span>
                <span className="text-[10px] font-bold text-text-secondary mt-0.5">
                  {stats.dailyHabitsCount > 0
                    ? t("activity.perfect_streak_desc")
                    : t("dashboard.streak_no_habits")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
