import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface Milestone {
  emoji: string;
  title: string;
  description: string;
}

export interface SectionGoalsMilestonesProps {
  milestones?: Milestone[];
}

export function SectionGoalsMilestones({ milestones }: SectionGoalsMilestonesProps) {
  const { t } = useTranslation();

  const defaultMilestones = milestones || [
    {
      emoji: "💝",
      title: t("shared_goals.first_habit"),
      description: t("shared_goals.first_habit_desc"),
    },
    {
      emoji: "🔥",
      title: t("shared_goals.seven_day_streak"),
      description: t("shared_goals.seven_day_streak_desc"),
    },
  ];

  return (
    <section className="card-duo flex flex-col gap-4">
      <div>
        <h2 className="font-extrabold text-sm text-text-primary flex items-center gap-2">
          <Compass className="h-4.5 w-4.5 text-accent" />
          <span>{t("shared_goals.milestones_title")}</span>
        </h2>
        <p className="text-xs text-text-secondary font-semibold mt-0.5">{t("shared_goals.milestones_desc")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {defaultMilestones.map((m, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-highlight/40 border-2 border-border-color rounded-xl p-3">
            <span className="text-3xl">{m.emoji}</span>
            <div className="flex flex-col">
              <span className="text-xs font-black text-text-primary">{m.title}</span>
              <span className="text-[10px] text-text-secondary font-bold">{m.description}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
