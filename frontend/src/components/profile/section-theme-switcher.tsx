import { Palette } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../stores/theme.store";

interface SectionThemeSwitcherProps {
  onThemeChange: (themeName: "Sakura" | "Duo" | "Light" | "Dark") => void;
}

export function SectionThemeSwitcher({ onThemeChange }: SectionThemeSwitcherProps) {
  const { theme } = useThemeStore();
  const { t } = useTranslation();

  const THEMES = React.useMemo(() => [
    { name: "Sakura", label: "Sakura Pink", bg: "#FF8FB1", text: "#FFF0F5", desc: t("themes.sakura_desc", { defaultValue: "Warm and supportive wife theme" }) },
    { name: "Duo", label: "Duo Green", bg: "#58CC02", text: "#F7F7F7", desc: t("themes.duo_desc", { defaultValue: "Gamified and clean husband theme" }) },
    { name: "Light", label: t("themes.light_label", { defaultValue: "Steel Blue" }), bg: "#2C3E50", text: "#F4F6F8", desc: t("themes.light_desc", { defaultValue: "Classic high contrast light theme" }) },
    { name: "Dark", label: t("themes.dark_label", { defaultValue: "Night Shade" }), bg: "#0F172A", text: "#1E293B", desc: t("themes.dark_desc", { defaultValue: "Sleek low lighting dark theme" }) },
  ] as const, [t]);

  return (
    <section className="card-duo flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-text-primary border-text-primary pb-1.5 flex items-center gap-2">
          <Palette className="h-5 w-5 text-accent" />
          <span>{t("profile.themes_title")}</span>
        </h2>
        <p className="text-xs text-text-secondary font-semibold mt-0.5">{t("profile.themes_desc")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {THEMES.map((themeItem) => {
          const active = theme === themeItem.name;
          return (
            <div
              key={themeItem.name}
              onClick={() => onThemeChange(themeItem.name)}
              className={`border-2 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all ${active
                ? "border-text-primary bg-highlight/50 shadow-[0_4px_0_0_var(--text-primary)]"
                : "border-border-color bg-card-surface hover:bg-highlight hover:border-text-primary"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-text-primary">{themeItem.label}</span>
                <div
                  className="h-5 w-5 rounded-full border-2 border-text-primary"
                  style={{ backgroundColor: themeItem.bg }}
                />
              </div>
              <p className="text-xs italic text-text-secondary/65 font-semibold leading-relaxed">
                {themeItem.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
