import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet, useLocation } from "@tanstack/react-router";
import { BarChart3, Loader2, LogOut, Settings, Timer } from "lucide-react";
import * as React from "react";
import { AppSwitcher } from "../components/app-switcher";
import { BottomNav } from "../components/navigation/bottom-nav";
import { Toaster } from "../components/Toaster";
import { Sidebar, type SidebarItem, type SidebarLinkComponent } from "../components/ui/sidebar";
import { useSession } from "../hooks/use-session";
import { logout, redirectAfterLogout } from "../services/auth.service";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const { data: user, isLoading, isError, refetch } = useSession();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout(user?.id);
      redirectAfterLogout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  // Every pomodoro route has its own menu item, so exact matching keeps exactly
  // one item highlighted at a time.
  const navItems: SidebarItem[] = [
    { label: "Timer", to: "/", icon: Timer },
    { label: "Statistik", to: "/stats", icon: BarChart3 },
    { label: "Pengaturan", to: "/settings", icon: Settings },
  ];

  if (isLoading) {
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

  // No user and no cached session. Either the redirect to /login is already in
  // flight (401) or the device has never opened this app online.
  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-shared-bg p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl border-3 border-border-color bg-card-surface p-6 text-center shadow-[0_4px_0_0_var(--border-color)]">
          <span className="text-4xl">{isError ? "📡" : "🔐"}</span>
          <h1 className="text-base font-black text-text-primary">
            {isError ? "Tidak bisa memeriksa sesi" : "Sesi tidak ditemukan"}
          </h1>
          <p className="text-xs font-bold leading-relaxed text-text-secondary">
            {isError
              ? "Perangkat ini sedang offline dan belum pernah membuka Pomodoro. Sambungkan internet sekali, lalu buka lagi."
              : "Silakan masuk lewat aplikasi Habit Pasutri terlebih dahulu."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-1 rounded-xl border-2 border-border-color bg-primary px-4 py-2 text-xs font-black text-text-primary shadow-[0_3px_0_0_var(--border-color)]"
          >
            Coba lagi
          </button>
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
        className="p-4 shadow-[1px_0_0_0_var(--border-color)]"
        classNames={{
          body: "flex flex-col gap-5",
          nav: "flex flex-col gap-2",
          itemActive: "nav-active-duo",
          icon: "h-5 w-5",
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
                <span className="text-2xl shrink-0">{user.avatar_emoji || "🦖"}</span>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-text-primary truncate">{user.name}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {user.role === "husband" ? "Suami" : "Istri"}
                </span>
              </div>
            </div>
          </>
        }
        footer={
          <div>
            <div className="mb-4 rounded-2xl border-2 border-border-color bg-highlight/60 p-3">
              <p className="text-[11px] font-bold leading-relaxed text-text-secondary">
                🍅 Pomodoro ini <span className="font-black text-text-primary">pribadi</span>.
                Sesi dan statistik hanya terlihat oleh akunmu sendiri.
              </p>
            </div>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border-2 border-transparent cursor-pointer w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar</span>
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Top Header */}
        <header className="flex md:hidden items-center justify-between px-3 py-2 bg-card-surface border-b-2 border-border-color sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <AppSwitcher isMobileHeader />
          <div className="flex items-center gap-2 shrink-0">
            {user.avatar_image ? (
              <img src={user.avatar_image} alt={user.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <span className="text-xl bg-highlight h-8 w-8 flex items-center justify-center rounded-full shrink-0">
                {user.avatar_emoji || "🦖"}
              </span>
            )}
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav items={navItems} activePath={location.pathname} />
      </div>
      <Toaster />
    </div>
  );
}
