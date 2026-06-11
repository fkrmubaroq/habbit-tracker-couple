import { Award, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface StreakHistoryItem {
  habitId: string;
  iconEmoji: string;
  title: string;
  longestStreak: number;
  currentStreak: number;
}

export interface SectionAnalyticsStreaksProps {
  streakHistory: StreakHistoryItem[];
}

export function SectionAnalyticsStreaks({ streakHistory }: SectionAnalyticsStreaksProps) {
  const { t, i18n } = useTranslation();

  return (
    <section className="card-duo flex flex-col gap-4">
      <h2 className="font-extrabold text-sm text-text-primary flex items-center gap-2 ">
        <Award className="h-5 w-5 text-accent" />
        <span>{t("analytics.streak_hist")}</span>
      </h2>

      {streakHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <span className="text-3xl">🔥</span>
          <p className="text-xs text-text-secondary font-bold mt-2">{t("analytics.no_active_streaks")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {streakHistory.map((streak) => (
            <div
              key={streak.habitId}
              className="flex items-center justify-between border-2 border-border-color rounded-xl p-3 bg-card-surface"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{streak.iconEmoji}</span>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xs text-text-primary line-clamp-1">{streak.title}</span>
                  <span className="text-[9px] text-text-secondary font-extrabold uppercase mt-0.5">
                    {t("analytics.longest_streak", {
                      count: streak.longestStreak,
                      defaultValue: i18n.language === "id"
                        ? `Terpanjang: ${streak.longestStreak} hari`
                        : `Longest: ${streak.longestStreak} days`
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5 text-primary">
                <Heart className="h-4.5 w-4.5 fill-current animate-pulse" />
                <span className="text-xs font-black text-text-primary">{streak.currentStreak}x</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
