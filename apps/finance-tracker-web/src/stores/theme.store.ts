import { create } from "zustand";

export type Theme = "Sakura" | "Duo" | "Light" | "Dark";

export interface ThemeOption {
  name: Theme;
  label: string;
  bg: string;
  desc: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    name: "Sakura",
    label: "Sakura Pink",
    bg: "#FF8FB1",
    desc: "Tema lembut & hangat favorit istri",
  },
  {
    name: "Duo",
    label: "Duo Green",
    bg: "#58CC02",
    desc: "Tema playful & energik favorit suami",
  },
  {
    name: "Light",
    label: "Steel Blue",
    bg: "#2C3E50",
    desc: "Tema klasik berdesain elegan & clean",
  },
  {
    name: "Dark",
    label: "Night Shade",
    bg: "#0F172A",
    desc: "Tema gelap modern yang nyaman di mata",
  },
];

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleNextTheme: () => void;
}

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "Sakura";
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored && ["Sakura", "Duo", "Light", "Dark"].includes(stored)) {
    document.documentElement.setAttribute("data-theme", stored);
    return stored;
  }
  document.documentElement.setAttribute("data-theme", "Sakura");
  return "Sakura";
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getStoredTheme(),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  toggleNextTheme: () => {
    const current = get().theme;
    const themes: Theme[] = ["Sakura", "Duo", "Light", "Dark"];
    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    get().setTheme(nextTheme);
  },
}));
