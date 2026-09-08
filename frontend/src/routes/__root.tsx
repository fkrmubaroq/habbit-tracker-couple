import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Calendar, CheckSquare, ClipboardList, Heart, HeartIcon, Home, LogOut, Plus, Settings, ShoppingBag, ShoppingCart } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { AppSwitcher } from "../components/app-switcher";
import { getActiveApp } from "../config/apps.config";
import { Toaster } from "../components/Toaster";
import { Button } from "../components/ui/button";
import { BottomNavigation } from "../components/navigation/bottom-navigation";
import { useAuthStore } from "../stores/auth.store";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated, user, logout } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  // Redirect to login if not authenticated and not on an auth page
  React.useEffect(() => {
    if (!isAuthenticated && !isAuthPage) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isAuthPage, navigate]);

  // If loading or checking auth
  if (!isAuthenticated && !isAuthPage) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-shared-bg">
        <div className="flex flex-col items-center gap-2">
          <Heart className="h-10 w-10 text-primary animate-bounce fill-current" />
          <span className="text-sm font-bold text-text-secondary">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  // Auth pages layout
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-shared-bg flex items-center justify-center p-4">
        <Outlet />
      </div>
    );
  }

  const currentApp = getActiveApp(location.pathname);

  const habitNavItems = [
    { label: t("nav.home"), to: "/", icon: Home },
    { label: t("nav.goals"), to: "/shared-goals", icon: HeartIcon },
    { label: t("nav.list_habits"), to: "/list-habits", icon: ClipboardList },
    { label: t("nav.activity"), to: "/activity", icon: Calendar },
    { label: t("nav.settings"), to: "/settings", icon: Settings },
  ];

  const groceryNavItems = [
    { label: t("grocery.nav_checklist", { defaultValue: "Daftar Belanja" }), to: "/grocery-list", icon: CheckSquare },
    { label: t("grocery.nav_manage", { defaultValue: "Belanja" }), to: "/grocery-list/manage", icon: ShoppingCart },
    { label: t("grocery.nav_settings", { defaultValue: "Pengaturan" }), to: "/grocery-list/settings", icon: Settings },
  ];

  const activeNavItems = currentApp.id === "grocery-list" ? groceryNavItems : habitNavItems;

  return (
    <div className="min-h-screen bg-shared-bg flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card-surface border-r-2 border-border-color h-screen fixed top-0 left-0 p-4 justify-between z-40 shadow-[1px_0_0_0_var(--border-color)]">
        <div className="flex flex-col gap-5">
          {/* App Switcher Header */}
          <div className="px-1 pt-1">
            <AppSwitcher />
          </div>

          {/* User Profile Summary */}
          {user && (
            <div className="flex items-center gap-3 bg-highlight p-3 rounded-xl border-2 border-border-color shadow-[0_2px_0_0_var(--border-color)]">
              {user.avatar_image ? (
                <img src={user.avatar_image} alt={user.name} className="h-8 w-8 rounded-xl object-cover border-2 border-border-color shrink-0" />
              ) : (
                <span className="text-2xl shrink-0">{user.avatar_emoji}</span>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-text-primary truncate">{user.name}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {activeNavItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold border-2 transition-all cursor-pointer ${active
                    ? "nav-active-duo"
                    : "border-transparent text-text-secondary hover:bg-highlight hover:text-text-primary"
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          {currentApp.id === "grocery-list" ? (
            <Button
              onClick={() => {
                if (location.pathname !== "/grocery-list") {
                  navigate({ to: "/grocery-list" });
                }
                const input = document.querySelector('input[placeholder*="Tulis barang"]') as HTMLInputElement;
                if (input) input.focus();
              }}
              variant="3d"
              className="w-full mb-4 font-extrabold flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5 stroke-3" />
              <span>{t("grocery.add_item")}</span>
            </Button>
          ) : (
            <Button
              onClick={() => navigate({ to: "/habits" })}
              variant="3d"
              className="w-full mb-4 font-extrabold flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5 stroke-3" />
              <span>{t("habits.create_habit")}</span>
            </Button>
          )}
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border-2 border-transparent cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Top Header */}
        <header className="flex md:hidden items-center justify-between px-3 py-2 bg-card-surface border-b-2 border-border-color sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <AppSwitcher isMobileHeader />
          {user && (
            <div className="flex items-center gap-2 shrink-0">
              {user.avatar_image ? (
                <img src={user.avatar_image} alt={user.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
              ) : (
                <span className="text-xl bg-highlight h-8 w-8 flex items-center justify-center rounded-full shrink-0">
                  {user.avatar_emoji}
                </span>
              )}
              <span className="text-xs font-bold text-text-primary max-w-[85px] truncate">{user.name}</span>
            </div>
          )}
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNavigation />
      </div>
      <Toaster />
    </div>
  );
}
