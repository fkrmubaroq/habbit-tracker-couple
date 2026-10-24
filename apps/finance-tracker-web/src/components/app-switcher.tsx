import * as React from "react";
import { AppSwitcher as CoreAppSwitcher } from "../components/ui/app-switcher";
import type { AppSwitcherApp } from "../components/ui/app-switcher";
import { CURRENT_APP_ID, SWITCHER_APPS } from "../config/apps.config";

interface AppSwitcherProps {
  className?: string;
  isMobileHeader?: boolean;
}

export const AppSwitcher: React.FC<AppSwitcherProps> = ({
  className,
  isMobileHeader = false,
}) => {
  const handleSelectApp = (app: AppSwitcherApp) => {
    const target = SWITCHER_APPS.find((entry) => entry.id === app.id);
    if (!target?.href) return;
    window.location.href = target.href;
  };

  return (
    <CoreAppSwitcher
      apps={SWITCHER_APPS}
      activeAppId={CURRENT_APP_ID}
      onSelect={handleSelectApp}
      isMobileHeader={isMobileHeader}
      className={className}
    />
  );
};
