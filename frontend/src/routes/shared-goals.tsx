import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SectionGoalsIntro } from "../components/shared-goals/section-goals-intro";
import { SectionGoalsList } from "../components/shared-goals/section-goals-list";
import { SectionGoalsMilestones } from "../components/shared-goals/section-goals-milestones";
import { useMyLogs, usePartnerLogs, useToggleCompletion } from "../hooks/use-habit-logs";
import { useMyHabits } from "../hooks/use-habits";
import { usePartnerProfile } from "../hooks/use-partner";

export const Route = createFileRoute("/shared-goals")({
  component: SharedGoalsComponent,
});

const getTodayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function SharedGoalsComponent() {
  const todayStr = getTodayStr();
  const { t } = useTranslation();

  // Queries
  const { data: habits = [] } = useMyHabits();
  const { data: myLogs = [] } = useMyLogs(todayStr, todayStr);
  const { data: partnerLogs = [] } = usePartnerLogs(todayStr, todayStr);
  const { data: partner } = usePartnerProfile();

  const toggleMutation = useToggleCompletion();

  const myCompletionsMap = new Map(myLogs.map((l) => [l.habit_id, l.is_completed]));
  const partnerCompletionsMap = new Map(partnerLogs.map((l) => [l.habit_id, l.is_completed]));

  // Shared habits filter
  const sharedHabits = habits.filter((h) => h.is_active && h.is_shared);

  const handleToggle = (habitId: string, isCurrentlyCompleted: boolean) => {
    toggleMutation.mutate({
      habit_id: habitId,
      completed_date: todayStr,
      is_completed: !isCurrentlyCompleted,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">{t("shared_goals.shared_goals")}</h1>
        <p className="text-text-secondary font-semibold text-sm">{t("shared_goals.shared_goals_desc")}</p>
      </div>

      {/* Intro info box */}
      <SectionGoalsIntro />

      {/* Shared Habits Grid list */}
      <SectionGoalsList
        sharedHabits={sharedHabits}
        myCompletionsMap={myCompletionsMap}
        partnerCompletionsMap={partnerCompletionsMap}
        partnerName={partner?.name}
        onToggle={handleToggle}
      />

      {/* Consistency Milestones list */}
      <SectionGoalsMilestones />
    </div>
  );
}

