import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { BarChart2, CheckSquare, Heart, Home, LogOut, Target, User } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/auth.store";
import { useThemeStore } from "../stores/theme.store";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme } = useThemeStore();
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

  const navItems = [
    { label: t("nav.home"), to: "/", icon: Home },
    { label: t("nav.habits"), to: "/habits", icon: CheckSquare },
    { label: t("nav.goals"), to: "/shared-goals", icon: Target },
    { label: t("nav.analytics"), to: "/analytics", icon: BarChart2 },
    { label: t("nav.profile"), to: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-shared-bg flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card-surface border-r-2 border-border-color h-screen fixed top-0 left-0 p-4 justify-between z-40 shadow-[1px_0_0_0_var(--border-color)]">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-3 border-b-2 border-border-color">
            <Heart className="h-8 w-8 text-primary fill-current animate-pulse" />
            <span className="text-xl font-bold tracking-tight text-text-primary">TwoHearts</span>
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
            {navItems.map((item) => {
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

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border-2 border-transparent cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          <span>{t("common.logout")}</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Top Header */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 bg-card-surface border-b-2 border-border-color sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-text-primary">TwoHearts</span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              {user.avatar_image ? (
                <img src={user.avatar_image} alt={user.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
              ) : (
                <span className="text-xl bg-highlight h-8 w-8 flex items-center justify-center rounded-full shrink-0">
                  {user.avatar_emoji}
                </span>
              )}
              <span className="text-xs font-bold text-text-primary">{user.name}</span>
            </div>
          )}
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 flex items-end md:hidden z-40 filter drop-shadow-[0_-4px_5px_rgba(0,0,0,0.04)]">
          {/* Left Navigation Group */}
          <div className="flex-1 h-16 bg-card-surface border-t-2 border-border-color flex justify-around items-center pl-2">
            {[
              { label: t("nav.home"), to: "/", icon: Home },
              { label: t("nav.goals"), to: "/shared-goals", icon: Target },
            ].map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center shrink-0 justify-center md:w-full size-12.5 rounded-lg transition-all border-2 border-transparent ${active
                    ? "nav-active-duo"
                    : "text-text-secondary"
                    }`}
                >
                  <item.icon
                    color={active ? "white" : undefined}
                    className="size-5" />
                  <span className={clsx("text-[9px] font-extrabold mt-0.5 truncate max-w-[50px]", {
                    "text-white": active,
                    "text-text-secondary": !active
                  })}>{item.label}</span>
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
                className={`fab-btn active`}
              >
                <CheckSquare color="white" className="h-5.5 w-5.5 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* Right Navigation Group */}
          <div className="flex-1 h-16 bg-card-surface border-t-2 border-border-color flex justify-around items-center pr-2">
            {[
              { label: t("nav.analytics"), to: "/analytics", icon: BarChart2 },
              { label: t("nav.profile"), to: "/profile", icon: User },
            ].map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center shrink-0 justify-center md:w-full size-12.5 px-1.5 py-1 rounded-lg transition-all border-2 border-transparent ${active
                    ? "nav-active-duo"
                    : "text-text-secondary"
                    }`}
                >
                  <item.icon
                    color={active ? "white" : undefined}
                    className="size-5" />
                  <span className={clsx("text-[9px] font-extrabold mt-0.5 truncate max-w-[50px]", {
                    "text-white": active,
                    "text-text-secondary": !active
                  })}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
