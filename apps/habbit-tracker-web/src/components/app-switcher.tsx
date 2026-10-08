import * as React from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  ChevronsUpDown,
  Check,
  Sparkles,
  X,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { APPS_REGISTRY, getActiveApp } from "../config/apps.config";
import type { MiniApp } from "../config/apps.config";
import { cn } from "../lib/utils";

interface AppSwitcherProps {
  className?: string;
  isMobileHeader?: boolean;
}

export const AppSwitcher: React.FC<AppSwitcherProps> = ({
  className,
  isMobileHeader = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentApp = getActiveApp(location.pathname);

  const handleSelectApp = (app: MiniApp) => {
    if (app.status !== "active") return;
    setIsOpen(false);
    if (location.pathname !== app.route) {
      navigate({ to: app.route });
    }
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "group flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all duration-200 text-left cursor-pointer select-none",
          "border-2 border-border-color bg-card-surface hover:bg-highlight hover:border-primary/50",
          "shadow-[0_2px_0_0_var(--border-color)] active:translate-y-[1px] active:shadow-none",
          isMobileHeader ? "py-1.5 px-2.5" : "w-full",
          className
        )}
        aria-label="Pilih aplikasi"
        title="Klik untuk ganti aplikasi"
      >
        {/* App Logo / Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          {currentApp.id === "habit-pasutri" ? (
            <img
              src="/favicon/favicon.svg"
              alt="Logo"
              className={cn("object-contain transition-transform group-hover:scale-105", isMobileHeader ? "h-7 w-7" : "h-8 w-8")}
            />
          ) : (
            <div
              className={cn(
                "rounded-xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105",
                currentApp.bgLight,
                isMobileHeader ? "h-7 w-7 text-sm" : "h-8 w-8 text-base"
              )}
            >
              <span>{currentApp.emoji}</span>
            </div>
          )}
        </div>

        {/* Title and Badge */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-extrabold tracking-tight text-text-primary truncate",
                isMobileHeader ? "text-sm" : "text-base"
              )}
            >
              {currentApp.name}
            </span>
          </div>
          {!isMobileHeader && (
            <span className="text-[11px] font-semibold text-text-secondary truncate">
              {currentApp.badge || "Aplikasi"}
            </span>
          )}
        </div>

        {/* Switcher Indicator */}
        <div className="flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors shrink-0">
          <ChevronsUpDown className={cn(isMobileHeader ? "h-4 w-4" : "h-4.5 w-4.5")} />
        </div>
      </button>

      {/* Popup / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div
            className={cn(
              "relative z-10 w-full max-w-md bg-card-surface rounded-3xl border-3 border-border-color",
              "shadow-[0_12px_24px_rgba(0,0,0,0.12),0_4px_0_0_var(--border-color)] overflow-hidden",
              "animate-in zoom-in-95 duration-200"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b-2 border-border-color/60 bg-highlight/30">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-text-primary">
                    Pilih Aplikasi Pasutri
                  </h3>
                  <p className="text-xs font-semibold text-text-secondary">
                    Ganti ruang kerja bersama pasangan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-highlight transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            {/* App List */}
            <div className="p-4 flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary px-1">
                Aplikasi Aktif
              </span>

              {APPS_REGISTRY.filter((app) => app.status === "active").map((app) => {
                const isActive = currentApp.id === app.id;
                const IconComponent = app.icon;

                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectApp(app)}
                    className={cn(
                      "flex items-start gap-3.5 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative group",
                      isActive
                        ? "border-primary bg-primary/10 shadow-[0_3px_0_0_var(--primary)]"
                        : "border-border-color bg-card-surface hover:bg-highlight hover:border-primary/40 shadow-[0_2px_0_0_var(--border-color)]"
                    )}
                  >
                    {/* App Icon */}
                    <div
                      className={cn(
                        "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold border-2",
                        isActive ? "border-primary/30 bg-card-surface shadow-xs" : "border-border-color " + app.bgLight
                      )}
                    >
                      <span>{app.emoji}</span>
                    </div>

                    {/* App Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-text-primary truncate">
                          {app.name}
                        </span>
                        {app.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                              isActive
                                ? "bg-primary text-white"
                                : "bg-highlight border border-border-color text-text-secondary"
                            )}
                          >
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-text-secondary mt-0.5 line-clamp-2">
                        {app.description}
                      </p>
                    </div>

                    {/* Active Checkmark or Arrow */}
                    <div className="shrink-0 self-center pl-1">
                      {isActive ? (
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Coming Soon Section */}
              <div className="mt-3 pt-3 border-t-2 border-border-color/60">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary px-1 flex items-center gap-1.5">
                  Segera Hadir
                  <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.2 rounded-md font-bold">
                    Coming Soon
                  </span>
                </span>

                <div className="mt-2 flex flex-col gap-2">
                  {APPS_REGISTRY.filter((app) => app.status === "coming_soon").map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-border-color/80 bg-highlight/30 opacity-75"
                    >
                      <div className="h-9 w-9 rounded-xl bg-card-surface border border-border-color flex items-center justify-center text-base shrink-0">
                        <span>{app.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-text-primary truncate">
                            {app.name}
                          </span>
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200">
                            {app.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-text-secondary truncate mt-0.5">
                          {app.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-highlight/40 border-t-2 border-border-color/60 text-center">
              <p className="text-[11px] font-semibold text-text-secondary">
                💡 Punya ide mini app lain untuk pasutri? Buka Pengaturan untuk beri saran!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
