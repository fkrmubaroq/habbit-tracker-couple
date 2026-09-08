import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Calendar, CheckSquare, ClipboardList, Home, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

export const CoreBottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const leftItems = [
    { label: t("nav.home"), to: "/", icon: Home },
    { label: t("nav.activity"), to: "/activity", icon: Calendar },
  ];

  const rightItems = [
    { label: t("nav.list_habits"), to: "/list-habits", icon: ClipboardList },
    { label: t("nav.settings"), to: "/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 flex items-end md:hidden z-40 filter drop-shadow-[0_-4px_5px_rgba(0,0,0,0.04)]">
      {/* Left Navigation Group */}
      <div className="flex-1 h-16 bg-card-surface border-t-2 border-border-color flex justify-around items-center">
        {leftItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center shrink-0 justify-center rounded-lg transition-all border-2 border-transparent"
            >
              <item.icon
                color={active ? "var(--primary)" : undefined}
                className="size-6"
              />
              <span
                className={clsx("text-[10px] font-extrabold mt-0.5 max-w-[50px] truncate", {
                  "text-primary": active,
                  "text-text-secondary": !active,
                })}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Center Notch Curved Part */}
      <div className="relative w-24 h-16 shrink-0 bg-transparent">
        {/* The SVG drawing the curved cutout */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 96 64"
          preserveAspectRatio="none"
        >
          {/* Filled background matching the bottom nav color */}
          <path
            d="M 0 0 L 8 0 C 18 0, 23 8, 28 16 C 33 24, 38 36, 48 36 C 58 36, 63 24, 68 16 C 73 8, 78 0, 88 0 L 96 0 L 96 64 L 0 64 Z"
            fill="var(--card-surface)"
          />
          {/* Top border stroke matching the bottom nav border */}
          <path
            d="M 0 1 L 8 1 C 18 1, 23 9, 28 17 C 33 25, 38 37, 48 37 C 58 37, 63 25, 68 17 C 73 9, 78 1, 88 1 L 96 1"
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="2"
          />
        </svg>

        {/* Center FAB Button placed in the middle of the notch */}
        <div className="absolute top-[-20px] left-[16px] shrink-0 size-16 flex items-center justify-center">
          <Link
            to="/habits"
            className="fab-btn active"
            title="Buat Habit Baru"
          >
            <CheckSquare color="white" className="h-5.5 w-5.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* Right Navigation Group */}
      <div className="flex-1 h-16 bg-card-surface border-t-2 border-border-color flex justify-around items-center">
        {rightItems.map((item) => {
          const active = location.pathname === item.to;
          const isPengaturan = item.to === "/settings";
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center shrink-0 justify-center rounded-lg transition-all border-2 border-transparent"
            >
              <item.icon
                color={active ? "var(--primary)" : undefined}
                className={clsx("size-6", {
                  "ml-1.5": isPengaturan,
                })}
              />
              <span
                className={clsx("text-[10px] font-extrabold mt-0.5 max-w-[50px] truncate", {
                  "text-primary": active,
                  "text-text-secondary": !active,
                })}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
