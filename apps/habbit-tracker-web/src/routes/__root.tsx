import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Calendar, ClipboardList, Heart, HeartIcon, Home, LogOut, Plus, Settings } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { AppSwitcher } from "../components/app-switcher";
import { Toaster } from "../components/Toaster";
import { Button } from "../components/ui/button";
import { Sidebar, type SidebarLinkComponent } from "../components/ui/sidebar";
import { BottomNavigation } from "../components/navigation/bottom-navigation";
import { useSession } from "../hooks/use-session";
import { useAuthStore } from "../stores/auth.store";
import { useToastStore } from "../stores/toast.store";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { user, logout } = useAuthStore();
  const { isAuthenticated, isLoading } = useSession();
  const { showToast } = useToastStore();

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: "/login" });
    } catch {
      showToast(t("common.logout_failed", { defaultValue: "Gagal logout. Periksa koneksi lalu coba lagi." }), "error");
    }
  };

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  // Redirect to login if not authenticated and not on an auth page
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthPage) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, isAuthPage, navigate]);

  // Auth pages layout
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-shared-bg flex items-center justify-center p-4">
        <Outlet />
      </div>
    );
  }

  // Checking session or unauthenticated (redirect in flight)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-shared-bg">
        <div className="flex flex-col items-center gap-2">
          <Heart className="h-10 w-10 text-primary animate-bounce fill-current" />
          <span className="text-sm font-bold text-text-secondary">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  const habitNavItems = [
    { label: t("nav.home"), to: "/", icon: Home },
    { label: t("nav.goals"), to: "/shared-goals", icon: HeartIcon },
    { label: t("nav.list_habits"), to: "/list-habits", icon: ClipboardList },
    { label: t("nav.activity"), to: "/activity", icon: Calendar },
    { label: t("nav.settings"), to: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-shared-bg flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar
        items={habitNavItems}
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
          </>
        }
        footer={
          <div>
            <Button
              onClick={() => navigate({ to: "/habits" })}
              variant="3d"
              className="w-full mb-4 font-extrabold flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5 stroke-3" />
              <span>{t("habits.create_habit")}</span>
            </Button>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border-2 border-transparent cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span>{t("common.logout")}</span>
            </button>
          </div>
        }
      />

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
