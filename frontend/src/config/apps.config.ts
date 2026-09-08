import {
  Calendar,
  CheckSquare,
  ClipboardList,
  Heart,
  HeartIcon,
  Home,
  Plus,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AppNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface MiniApp {
  id: string;
  name: string;
  slug: string;
  route: string;
  icon: LucideIcon;
  emoji: string;
  description: string;
  badge?: string;
  status: "active" | "coming_soon";
  themeColor: string;
  bgLight: string;
  navItems: AppNavItem[];
  primaryAction?: {
    label: string;
    to?: string;
    actionId?: string;
    icon: LucideIcon;
  };
}

export const APPS_REGISTRY: MiniApp[] = [
  {
    id: "habit-pasutri",
    name: "Habit Pasutri",
    slug: "habbit-pasutri",
    route: "/",
    icon: Heart,
    emoji: "💖",
    description: "Pelacak kebiasaan & streak bersama pasangan",
    badge: "Core App",
    status: "active",
    themeColor: "text-pink-500",
    bgLight: "bg-pink-100",
    navItems: [
      { label: "nav.home", to: "/", icon: Home },
      { label: "nav.goals", to: "/shared-goals", icon: HeartIcon },
      { label: "nav.list_habits", to: "/list-habits", icon: ClipboardList },
      { label: "nav.activity", to: "/activity", icon: Calendar },
      { label: "nav.settings", to: "/settings", icon: Settings },
    ],
    primaryAction: {
      label: "habits.create_habit",
      to: "/habits",
      icon: Plus,
    },
  },
  {
    id: "grocery-list",
    name: "Grocery List",
    slug: "grocery-list",
    route: "/grocery-list",
    icon: ShoppingCart,
    emoji: "🛒",
    description: "Daftar belanjaan & kebutuhan dapur pasutri",
    badge: "Mini App",
    status: "active",
    themeColor: "text-emerald-500",
    bgLight: "bg-emerald-100",
    navItems: [
      { label: "grocery.nav_checklist", to: "/grocery-list", icon: CheckSquare },
      { label: "grocery.nav_manage", to: "/grocery-list/manage", icon: ShoppingCart },
      { label: "grocery.nav_settings", to: "/grocery-list/settings", icon: Settings },
    ],
    primaryAction: {
      label: "grocery.add_item",
      to: "/grocery-list/manage",
      icon: Plus,
    },
  },
  {
    id: "couple-finances",
    name: "Keuangan Pasutri",
    slug: "couple-finances",
    route: "#",
    icon: Wallet,
    emoji: "💰",
    description: "Pencatatan pengeluaran & tabungan bersama",
    badge: "Segera Hadir",
    status: "coming_soon",
    themeColor: "text-amber-500",
    bgLight: "bg-amber-100",
    navItems: [],
  },
  {
    id: "couple-calendar",
    name: "Jadwal & Kencan",
    slug: "couple-calendar",
    route: "#",
    icon: Calendar,
    emoji: "📅",
    description: "Kalender agenda & quality time berdua",
    badge: "Segera Hadir",
    status: "coming_soon",
    themeColor: "text-blue-500",
    bgLight: "bg-blue-100",
    navItems: [],
  },
];

export function getActiveApp(pathname: string): MiniApp {
  if (pathname.startsWith("/grocery-list")) {
    return APPS_REGISTRY.find((app) => app.id === "grocery-list") || APPS_REGISTRY[0];
  }
  return APPS_REGISTRY[0];
}
