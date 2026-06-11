import { create } from "zustand";

type Theme = "Sakura" | "Duo" | "Light" | "Dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored && ["Sakura", "Duo", "Light", "Dark"].includes(stored)) {
    // Apply immediately to html tag
    document.documentElement.setAttribute("data-theme", stored);
    return stored;
  }
  
  // Default fallback: Sakura Pink
  document.documentElement.setAttribute("data-theme", "Sakura");
  return "Sakura";
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
}));
