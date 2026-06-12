import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MonthlyHabitTable } from "../components/activity/monthly-habit-table";
import { YearlyActivityHeatmap } from "../components/activity/yearly-activity-heatmap";
import { ActivitySummarySection } from "../components/activity/activity-summary-section";
import { useAuthStore } from "../stores/auth.store";

export const Route = createFileRoute("/activity")({
  component: ActivityComponent,
});

function ActivityComponent() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col gap-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            {t("activity.title")}
          </h1>
          <p className="text-text-secondary font-semibold text-sm">
            {t("activity.desc")}
          </p>
        </div>
      </div>

      {/* Section Summary */}
      <ActivitySummarySection />

      {/* Section 1: Monthly Habit Table */}
      <MonthlyHabitTable currentUserId={user?.id} />

      {/* Section 2: Yearly Activity Heatmap */}
      <YearlyActivityHeatmap currentUserId={user?.id} />
    </div>
  );
}
