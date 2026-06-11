import { Check, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SectionLanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  return (
    <section className="card-duo flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-text-primary border-text-primary pb-1.5 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-accent" />
          <span>{t("profile.language")}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        {[
          { code: "id", name: "Bahasa Indonesia", emoji: "🇮🇩" },
          { code: "en", name: "English", emoji: "🇺🇸" }
        ].map((lang) => {
          const active = i18n.language.startsWith(lang.code);
          return (
            <div
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${active
                ? "border-text-primary bg-highlight/50 shadow-[0_4px_0_0_var(--text-primary)]"
                : "border-border-color bg-card-surface hover:bg-highlight hover:border-text-primary"
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{lang.emoji}</span>
                <span className="font-extrabold text-sm text-text-primary">{lang.name}</span>
              </div>
              {active && <Check className="h-5 w-5 text-primary stroke-[3]" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
