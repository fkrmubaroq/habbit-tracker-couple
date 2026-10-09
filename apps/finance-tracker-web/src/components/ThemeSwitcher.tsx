import React from "react";
import { Palette, Check, Sparkles } from "lucide-react";
import { useThemeStore, THEME_OPTIONS, Theme } from "../stores/theme.store.js";

export function ThemeSwitcherSection() {
  const { theme, setTheme } = useThemeStore();

  return (
    <section className="bg-card-surface border-2 border-border-color rounded-2xl p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-black text-text-primary flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary stroke-[2.5]" />
          <span>Tema & Warna Pasutri</span>
        </h2>
        <p className="text-xs text-text-secondary font-semibold mt-1">
          Pilih suasana visual favorit Anda. Pengaturan ini otomatis tersinkronisasi di seluruh aplikasi pasangan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {THEME_OPTIONS.map((item) => {
          const isActive = theme === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setTheme(item.name)}
              className={`text-left border-2 rounded-2xl p-4.5 flex flex-col gap-3 transition-all cursor-pointer relative overflow-hidden ${
                isActive
                  ? "border-primary bg-highlight shadow-[0_4px_0_0_var(--border-color)] scale-[1.02]"
                  : "border-border-color bg-card-surface hover:bg-highlight/60 hover:border-border-color"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-text-primary tracking-tight">
                  {item.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-5 w-5 rounded-full border-2 border-text-primary shadow-xs"
                    style={{ backgroundColor: item.bg }}
                  />
                  {isActive && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-text-secondary font-semibold leading-relaxed">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function QuickThemeToggle() {
  const { theme, toggleNextTheme } = useThemeStore();
  const currentOption = THEME_OPTIONS.find((t) => t.name === theme) || THEME_OPTIONS[0];

  return (
    <button
      type="button"
      onClick={toggleNextTheme}
      title={`Tema saat ini: ${currentOption.label}. Klik untuk ganti tema.`}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-border-color bg-card-surface hover:bg-highlight text-text-primary text-xs font-bold transition-all shadow-[0_2px_0_0_var(--border-color)] active:translate-y-0.5 active:shadow-none cursor-pointer"
    >
      <span
        className="w-3.5 h-3.5 rounded-full border border-text-primary/40 shrink-0"
        style={{ backgroundColor: currentOption.bg }}
      />
      <span className="hidden sm:inline">{currentOption.label}</span>
      <Sparkles className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
    </button>
  );
}
