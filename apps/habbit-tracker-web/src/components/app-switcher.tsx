import * as React from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { AppSwitcher as CoreAppSwitcher } from "../components/ui/app-switcher";
import type { AppSwitcherApp } from "../components/ui/app-switcher";
import { APPS_REGISTRY, getActiveApp } from "../config/apps.config";

interface AppSwitcherProps {
  className?: string;
  isMobileHeader?: boolean;
}

// Habit app logo lives in this app's public folder, so the path is supplied here
// rather than baked into the shared component.
const HABIT_LOGO_SRC = "/favicon/favicon.svg";

const SWITCHER_APPS: AppSwitcherApp[] = APPS_REGISTRY.map((app) => ({
  id: app.id,
  name: app.name,
  emoji: app.emoji,
  description: app.description,
  badge: app.badge,
  status: app.status,
  bgLight: app.bgLight,
  logoSrc: app.id === "habit-pasutri" ? HABIT_LOGO_SRC : undefined,
  external: Boolean(app.externalUrl),
}));

export const AppSwitcher: React.FC<AppSwitcherProps> = ({
  className,
  isMobileHeader = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentApp = getActiveApp(location.pathname);

  const handleSelectApp = (app: AppSwitcherApp) => {
    const target = APPS_REGISTRY.find((entry) => entry.id === app.id);
    if (!target || target.status !== "active") return;

    if (target.externalUrl) {
      window.location.href = target.externalUrl;
      return;
    }

    if (location.pathname !== target.route) {
      navigate({ to: target.route });
    }
  };

  return (
    <CoreAppSwitcher
      apps={SWITCHER_APPS}
      activeAppId={currentApp.id}
      onSelect={handleSelectApp}
      isMobileHeader={isMobileHeader}
      className={className}
    />
  );
};
