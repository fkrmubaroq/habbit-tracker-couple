import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SectionGoalsIntro() {
  const { t } = useTranslation();

  return (
    <section className="card-duo bg-primary/10 border-primary p-5 flex items-start gap-4">
      <Heart className="h-10 w-10 text-primary shrink-0 fill-current animate-pulse" />
      <div className="flex flex-col gap-1">
        <h2 className="font-extrabold text-sm text-text-primary">{t("shared_goals.habits_for_two")}</h2>
        <p className="text-xs text-text-secondary font-semibold leading-relaxed">
          {t("shared_goals.habits_for_two_desc")}
        </p>
      </div>
    </section>
  );
}
