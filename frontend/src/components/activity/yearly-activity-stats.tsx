import * as React from "react";
import { useTranslation } from "react-i18next";

interface YearlyActivityStatsProps {
  totalCompletions: number;
  consistentDays: number;
  successPercentage: number;
  activeHabitsCount: number;
  isLoading?: boolean;
}

export function YearlyActivityStats({
  totalCompletions,
  consistentDays,
  successPercentage,
  activeHabitsCount,
  isLoading
}: YearlyActivityStatsProps) {
  const { t } = useTranslation();

  if (isLoading) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total completions */}
      <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-3 flex items-center gap-3">
        <span className="text-2xl bg-primary/20 text-primary p-2.5 rounded-xl border border-primary/25 shrink-0">🏆</span>
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">{t("activity.completions_stat")}</span>
          <span className="text-lg font-black text-text-primary mt-1">{totalCompletions}</span>
        </div>
      </div>

      {/* Consistent Days */}
      <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-3 flex items-center gap-3">
        <span className="text-2xl bg-accent/20 text-accent p-2.5 rounded-xl border border-accent/25 shrink-0">🔥</span>
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">{t("activity.days_stat")}</span>
          <span className="text-lg font-black text-text-primary mt-1">{t("activity.days_value", { count: consistentDays })}</span>
        </div>
      </div>

      {/* Success rate percentage */}
      <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-3 flex items-center gap-3">
        <span className="text-2xl bg-secondary/20 text-secondary p-2.5 rounded-xl border border-secondary/25 shrink-0">📈</span>
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">{t("activity.percentage_stat")}</span>
          <span className="text-lg font-black text-text-primary mt-1">{successPercentage}%</span>
        </div>
      </div>

      {/* Active habits count */}
      <div className="bg-highlight/50 border-2 border-border-color rounded-2xl p-3 flex items-center gap-3">
        <span className="text-2xl bg-highlight border border-border-color/80 p-2.5 rounded-xl shrink-0">📋</span>
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-text-secondary leading-none uppercase">{t("activity.active_habits")}</span>
          <span className="text-lg font-black text-text-primary mt-1">{activeHabitsCount}</span>
        </div>
      </div>
    </div>
  );
}
