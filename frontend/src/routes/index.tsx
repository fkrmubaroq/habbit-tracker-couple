import { createFileRoute } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { Heart, Trophy } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ConsecutiveStreak } from "../components/ConsecutiveStreak";
import { HabitsChecklist } from "../components/HabitsChecklist";
import { useMyLogs, usePartnerLogs, useToggleCompletion } from "../hooks/use-habit-logs";
import { useMyHabits } from "../hooks/use-habits";
import { usePartnerProfile } from "../hooks/use-partner";
import { useAuthStore } from "../stores/auth.store";

export const Route = createFileRoute("/")({
  component: DashboardComponent,
});

const getTodayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function DashboardComponent() {
  const { user } = useAuthStore();
  const todayStr = getTodayStr();
  const { t } = useTranslation();

  // Queries
  const { data: habits = [], isLoading: habitsLoading } = useMyHabits();
  const { data: myLogs = [], isLoading: logsLoading } = useMyLogs(todayStr, todayStr);
  const { data: partnerLogs = [], isLoading: partnerLogsLoading } = usePartnerLogs(todayStr, todayStr);
  const { data: partner } = usePartnerProfile();

  // Mutations
  const toggleMutation = useToggleCompletion();

  // Local state for tabs and animations
  const [showMilestone, setShowMilestone] = React.useState<{ show: boolean; badgeName: string } | null>(null);

  const handleToggle = (habitId: string, isCurrentlyCompleted: boolean, emoji: string) => {
    toggleMutation.mutate(
      {
        habit_id: habitId,
        completed_date: todayStr,
        is_completed: !isCurrentlyCompleted,
      },
      {
        onSuccess: (data) => {
          if (!isCurrentlyCompleted) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.8 },
            });
            // If badge is unlocked, show milestone alert
            if (data.unlockedBadges && data.unlockedBadges.length > 0) {
              setShowMilestone({ show: true, badgeName: data.unlockedBadges[0].name });
              setTimeout(() => setShowMilestone(null), 4000);
            }
          }
        },
      }
    );
  };


  const isLoading = habitsLoading || logsLoading || partnerLogsLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Heart className="h-8 w-8 text-primary animate-bounce fill-current" />
          <span className="font-bold text-text-secondary">{t("dashboard.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {/* CSS Keyframes inline block */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 2;
        }
      `}</style>

      {/* Milestone Unlock Alert Toast */}
      {showMilestone?.show && (
        <div className="fixed top-20 left-[50%] translate-x-[-50%] bg-accent text-text-primary px-6 py-4 rounded-2xl border-2 border-text-primary shadow-[0_6px_0_0_#1f2937] flex items-center gap-3 z-50 animate-bounce">
          <Trophy className="h-6 w-6 text-text-primary animate-pulse" />
          <div>
            <p className="font-extrabold text-sm uppercase tracking-wide">{t("dashboard.milestone_unlocked")}</p>
            <p className="text-xs font-bold opacity-90">{t("dashboard.earned_badge_desc", { name: showMilestone.badgeName })}</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{t("dashboard.title")}</h1>
        <p className="text-text-secondary font-semibold text-sm">{t("dashboard.welcome", { name: user?.name })}</p>
      </div>

      {/* Consecutive Daily Streak Section */}
      <ConsecutiveStreak />

      {/* Daily/Weekly/Monthly Habits Checklist tabs */}
      <HabitsChecklist
        habits={habits}
        myLogs={myLogs}
        partnerLogs={partnerLogs}
        partner={partner}
        onToggle={handleToggle}
      />
    </div>
  );
}

