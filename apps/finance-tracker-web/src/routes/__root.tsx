import { createRootRouteWithContext, Link, Outlet, useLocation } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import * as React from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Settings,
  Plus,
  Coins,
  ExternalLink,
  Loader2,
  LogOut,
} from "lucide-react";
import { AppSwitcher } from "../components/app-switcher";
import { QuickThemeToggle } from "../components/ThemeSwitcher";
import { Button } from "../components/ui";
import { Sidebar, type SidebarLinkComponent } from "../components/ui/sidebar";
import { BottomNav } from "../components/navigation/bottom-nav";
import { useSession } from "../hooks/use-session";
import { logout, redirectAfterLogout } from "../services/auth.service";
import { HABIT_APP_URL } from "../services/session-url";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const { data: user, isLoading, isError } = useSession();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      redirectAfterLogout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Transaksi", to: "/transactions", icon: ArrowLeftRight, match: "prefix" as const },
    { label: "Budget", to: "/budget", icon: PieChart },
    { label: "Laporan", to: "/reports", icon: BarChart3 },
    { label: "Net Worth", to: "/net-worth", icon: Coins },
    { label: "Pengaturan", to: "/settings", icon: Settings },
  ];

  if (isLoading || isError || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-shared-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <span className="text-sm font-bold text-text-secondary">
            Memeriksa sesi login...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shared-bg flex flex-col md:flex-row text-text-primary">
      {/* Desktop Sidebar */}
      <Sidebar
        items={navItems}
        activePath={location.pathname}
        linkComponent={Link as unknown as SidebarLinkComponent}
        className="p-5 shadow-[1px_0_0_0_var(--border-color)]"
        classNames={{
          body: "flex flex-col gap-5",
          nav: "flex flex-col gap-1.5",
          item: "flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer",
          itemActive: "bg-highlight text-primary border-2 border-primary shadow-[0_2px_0_0_var(--border-color)] font-extrabold",
          itemInactive: "text-text-secondary hover:bg-highlight hover:text-text-primary border-2 border-transparent",
          icon: "h-5 w-5 stroke-[2.2]",
        }}
        header={
          <>
            {/* App Switcher Header */}
            <div className="px-1 pt-1">
              <AppSwitcher />
            </div>

            {/* User Profile Summary */}
            <div className="flex items-center gap-3 bg-highlight p-3 rounded-xl border-2 border-border-color shadow-[0_2px_0_0_var(--border-color)]">
              {user.avatar_image ? (
                <img
                  src={user.avatar_image}
                  alt={user.name}
                  className="h-8 w-8 rounded-xl object-cover border-2 border-border-color shrink-0"
                />
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
          </>
        }
        footer={
          <div>
            <Link to="/transactions/create" className="block w-full mb-4">
              <Button
                type="button"
                variant="3d"
                className="btn-3d w-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-extrabold shadow-[0_4px_0_0_color-mix(in_srgb,var(--primary)_75%,#000)]"
              >
                <Plus className="h-5 w-5 stroke-[3]" />
                <span>+ Transaksi</span>
              </Button>
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border-2 border-transparent cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-6">
        {/* Top Header Mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card-surface border-b-2 border-border-color sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {user.avatar_image ? (
              <img
                src={user.avatar_image}
                alt={user.name}
                className="h-8 w-8 rounded-lg object-cover border-2 border-border-color shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-highlight border-2 border-border-color flex items-center justify-center shrink-0 text-base">
                {user.avatar_emoji}
              </div>
            )}
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-extrabold text-sm text-text-primary truncate">Keuangan Pasutri</span>
              <span className="text-[10px] font-semibold text-text-secondary truncate max-w-[110px]">
                {user.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={HABIT_APP_URL}
              aria-label="Buka Habit Tracker"
              title="Buka Habit Tracker"
              className="h-8 w-8 flex items-center justify-center rounded-lg border-2 border-border-color bg-card-surface text-text-secondary hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <QuickThemeToggle />
            <Link to="/transactions/create">
              <Button
                type="button"
                variant="3d"
                size="sm"
                className="btn-3d py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Catat</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav items={navItems} activePath={location.pathname} />
    </div>
  );
}
