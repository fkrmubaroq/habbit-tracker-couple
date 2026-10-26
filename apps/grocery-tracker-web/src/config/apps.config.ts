import type { AppSwitcherApp } from "../components/ui/app-switcher";
import { FINANCE_APP_URL, HABIT_APP_URL, POMODORO_APP_URL } from "../services/session-url";

export interface GrocerySwitcherApp extends AppSwitcherApp {
  /** Absolute URL of the app. Absent for the currently running app. */
  href?: string;
}

/**
 * Mirror of the switcher registry used by `habbit-tracker-web` and
 * `finance-tracker-web`.
 *
 * Grocery runs as its own deployment, so every sibling app is reached by URL
 * instead of an in-router `to` path.
 */
export const SWITCHER_APPS: GrocerySwitcherApp[] = [
  {
    id: "habit-pasutri",
    name: "Habit Pasutri",
    emoji: "💖",
    description: "Pelacak kebiasaan & streak bersama pasangan",
    badge: "Core App",
    status: "active",
    bgLight: "bg-pink-100",
    logoSrc: `${HABIT_APP_URL}/favicon/favicon.svg`,
    external: true,
    href: HABIT_APP_URL,
  },
  {
    id: "grocery-list",
    name: "Grocery List",
    emoji: "🛒",
    description: "Daftar belanjaan & kebutuhan dapur pasutri",
    badge: "Mini App",
    status: "active",
    bgLight: "bg-emerald-100",
  },
  {
    id: "couple-finances",
    name: "Keuangan Pasutri",
    emoji: "💰",
    description: "Pencatatan pengeluaran & tabungan bersama",
    badge: "Mini App",
    status: "active",
    bgLight: "bg-amber-100",
    external: true,
    href: FINANCE_APP_URL,
  },
  {
    id: "pomodoro",
    name: "Pomodoro",
    emoji: "🍅",
    description: "Timer fokus pribadi dengan riwayat & statistik",
    badge: "Mini App",
    status: "active",
    bgLight: "bg-red-100",
    external: true,
    href: POMODORO_APP_URL,
  },
  {
    id: "couple-calendar",
    name: "Jadwal & Kencan",
    emoji: "📅",
    description: "Kalender agenda & quality time berdua",
    badge: "Segera Hadir",
    status: "coming_soon",
    bgLight: "bg-blue-100",
  },
];

export const CURRENT_APP_ID = "grocery-list";
