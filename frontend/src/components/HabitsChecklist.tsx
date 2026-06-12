import * as React from "react";
import { useTranslation } from "react-i18next";
import type { Habit } from "../types/index";
import { Checkbox } from "./ui/checkbox";

interface HabitsChecklistProps {
  habits: Habit[];
  myLogs: any[];
  partnerLogs: any[];
  partner: any;
  onToggle: (habitId: string, isCurrentlyCompleted: boolean, emoji: string) => void;
}

export function HabitsChecklist({
  habits,
  myLogs,
  partnerLogs,
  partner,
  onToggle,
}: HabitsChecklistProps) {
  const { t } = useTranslation();
  const [activeFrequency, setActiveFrequency] = React.useState<"all" | "daily" | "weekly" | "monthly">("all");

  const myCompletionsMap = React.useMemo(() => new Map(myLogs.map((l) => [l.habit_id, l.is_completed])), [myLogs]);
  const partnerCompletionsMap = React.useMemo(() => new Map(partnerLogs.map((l) => [l.habit_id, l.is_completed])), [partnerLogs]);

  // Filter habits by frequency on client-side
  const filteredHabits = React.useMemo(() => {
    const activeHabits = habits.filter((h) => h.is_active);
    if (activeFrequency === "all") return activeHabits;
    return activeHabits.filter((h) => h.frequency === activeFrequency);
  }, [habits, activeFrequency]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
        {/* Quick Frequency filter tabs */}
        <div className="tabs-duo-container">
          {(["all", "daily", "weekly", "monthly"] as const).map((freq) => (
            <button
              key={freq}
              onClick={() => setActiveFrequency(freq)}
              className={`tab-duo-btn ${activeFrequency === freq ? "active" : ""}`}
            >
              {t("dashboard." + freq)}
            </button>
          ))}
        </div>
      </div>

      {filteredHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-card-surface border-2 border-dashed border-text-secondary rounded-2xl text-center">
          <span className="text-4xl mb-2">🎈</span>
          <p className="font-bold text-text-primary">{t("dashboard.no_active_habits")}</p>
          <p className="text-xs text-text-secondary font-semibold mt-1">{t("dashboard.start_journey_desc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHabits.map((habit) => {
            const isCompleted = myCompletionsMap.get(habit.id) || false;
            const partnerCompleted = partnerCompletionsMap.get(habit.id) || false;

            return (
              <div
                key={habit.id}
                className={`card-duo flex flex-col justify-between gap-3 relative transition-all duration-300 ${isCompleted && (!habit.is_shared || partnerCompleted)
                  ? "bg-primary/5 border-primary shadow-[0_4px_0_0_var(--primary)]"
                  : ""
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Emoji Icon */}
                    <span className="text-3xl flex bg-highlight h-12 w-12 items-center justify-center rounded-xl border-2 border-border-color">
                      {habit.icon_emoji}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm text-text-primary flex items-center gap-1.5">
                        {habit.title}
                        {habit.is_shared && (
                          <span className="text-[10px] bg-accent/20 text-text-primary border border-text-primary px-1.5 py-0.5 rounded-full font-black">
                            {t("dashboard.shared")}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-text-secondary font-extrabold uppercase mt-0.5">
                        {t("dashboard." + habit.frequency)}
                      </span>
                    </div>
                  </div>

                  {/* Checkbox trigger button */}
                  <Checkbox
                    checked={isCompleted}
                    onClick={() => onToggle(habit.id, isCompleted, habit.icon_emoji)}
                    size="sm"
                    className="max-[400px]:hidden!"
                  />
                </div>

                {habit.description && (
                  <p className="text-xs text-text-secondary font-semibold pl-1.5 border-l-2 border-border-color">
                    {habit.description}
                  </p>
                )}

                {/* Shared logs visibility indicators */}
                {habit.is_shared ? (
                  <div className="flex items-center justify-between border-t-2 border-highlight pt-2 text-xs font-bold">
                    <span className="text-text-secondary text-[10px] uppercase">
                      {t("dashboard.connection_progress")}
                    </span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1">
                        <span>{t("dashboard.you")}:</span>
                        <span
                          className={`h-4.5 px-1.5 flex items-center justify-center rounded-md border text-[10px] ${isCompleted
                            ? "bg-primary text-text-primary border-text-primary"
                            : "bg-highlight text-text-secondary border-transparent"
                            }`}
                        >
                          {isCompleted ? t("dashboard.done") : t("common.pending")}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>{partner?.name || t("dashboard.shared")}:</span>
                        <span
                          className={`h-4.5 px-1.5 flex items-center justify-center rounded-md border text-[10px] ${partnerCompleted
                            ? "bg-secondary text-text-primary border-text-primary"
                            : "bg-highlight text-text-secondary border-transparent"
                            }`}
                        >
                          {partnerCompleted ? t("dashboard.done") : t("common.pending")}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : null}

                <Checkbox
                  checked={isCompleted}
                  onClick={() => onToggle(habit.id, isCompleted, habit.icon_emoji)}
                  size="sm"
                  className="min-[401px]:hidden! ml-auto"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
