import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { CheckSquare, ShoppingCart, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

export const GroceryBottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    {
      id: "checklist",
      label: t("grocery.nav_checklist", { defaultValue: "Daftar Belanja" }),
      to: "/grocery-list",
      icon: CheckSquare,
      isActive: (pathname: string) =>
        pathname === "/grocery-list" || pathname === "/grocery-list/",
    },
    {
      id: "manage",
      label: t("grocery.nav_manage", { defaultValue: "Belanja" }),
      to: "/grocery-list/manage",
      icon: ShoppingCart,
      isActive: (pathname: string) => pathname.startsWith("/grocery-list/manage"),
    },
    {
      id: "settings",
      label: t("grocery.nav_settings", { defaultValue: "Pengaturan" }),
      to: "/grocery-list/settings",
      icon: Settings,
      isActive: (pathname: string) => pathname.startsWith("/grocery-list/settings"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card-surface border-t-2 border-border-color flex md:hidden items-center justify-around px-3 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => {
        const active = item.isActive(location.pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            to={item.to}
            className={clsx(
              "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all select-none min-w-[72px] cursor-pointer",
              active
                ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-200 shadow-xs scale-102"
                : "text-text-secondary hover:text-text-primary hover:bg-highlight border-2 border-transparent"
            )}
          >
            <Icon
              className={clsx("h-5.5 w-5.5 transition-transform", {
                "stroke-[2.5] scale-110": active,
                "stroke-2": !active,
              })}
            />
            <span
              className={clsx("text-[10px] font-black mt-0.5 tracking-tight", {
                "text-emerald-700": active,
                "text-text-secondary": !active,
              })}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
