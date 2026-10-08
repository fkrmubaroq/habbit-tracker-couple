import { Check, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Habit } from "../../types/index";
import { Checkbox } from "../ui/checkbox";

export interface SectionGoalsListProps {
  sharedHabits: Habit[];
  myCompletionsMap: Map<string, boolean>;
  partnerCompletionsMap: Map<string, boolean>;
  partnerName?: string;
  onToggle: (habitId: string, isCurrentlyCompleted: boolean) => void;
}

export function SectionGoalsList({
  sharedHabits,
  myCompletionsMap,
  partnerCompletionsMap,
  partnerName,
  onToggle,
}: SectionGoalsListProps) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
        <Users className="h-5 w-5 text-accent" />
        <span>{t("shared_goals.active_couple_goals", { count: sharedHabits.length })}</span>
      </h2>

      {sharedHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card-surface border-2 border-dashed border-text-secondary rounded-2xl text-center">
          <span className="text-4xl mb-2">🤝</span>
          <p className="font-bold text-text-primary">{t("shared_goals.no_shared_goals")}</p>
          <p className="text-xs text-text-secondary font-semibold mt-1">
            {t("shared_goals.no_shared_goals_desc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sharedHabits.map((habit) => {
            const isCompleted = myCompletionsMap.get(habit.id) || false;
            const partnerCompleted = partnerCompletionsMap.get(habit.id) || false;

            return (
              <div key={habit.id} className="card-duo flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 bg-card-surface">
                {/* Info */}
                <div className="flex items-center gap-4">
                  <span className="text-4xl bg-highlight h-14 w-14 flex items-center justify-center rounded-xl border-2 border-text-primary">
                    {habit.icon_emoji}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base text-text-primary">{habit.title}</span>
                    <span className="text-xs text-text-secondary font-bold uppercase mt-0.5">
                      {t("dashboard." + habit.frequency)}
                    </span>
                    {habit.description && (
                      <p className="text-xs text-text-secondary font-semibold mt-1">
                        {habit.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mutual completions indicators */}
                <div className="flex items-center gap-6 self-center">
                  {/* User toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Checkbox
                      checked={isCompleted}
                      onClick={() => onToggle(habit.id, isCompleted)} size="sm"
                    />

                    <span className="text-[10px] font-extrabold text-text-secondary uppercase">{t("dashboard.you")}</span>
                  </div>

                  {/* Connection indicator */}
                  <div className="flex flex-col items-center h-12 justify-center">
                    <div className={`h-1.5 w-10 border-2 border-border-color ${isCompleted && partnerCompleted ? "bg-primary" : "bg-highlight"}`} />
                  </div>

                  {/* Partner toggle visibility */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-12 w-12 flex items-center justify-center rounded-2xl border-2 border-border-color ${partnerCompleted ? "bg-secondary text-text-primary" : "bg-highlight text-text-secondary"
                        }`}
                    >
                      {partnerCompleted ? <Check className="h-6 w-6 stroke-[3.5]" /> : null}
                    </div>
                    <span className="text-[10px] font-extrabold text-text-secondary uppercase truncate max-w-[60px]">
                      {partnerName || t("dashboard.shared")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
