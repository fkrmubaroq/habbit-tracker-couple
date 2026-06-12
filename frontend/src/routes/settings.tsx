import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { SectionLanguageSwitcher } from "../components/profile/section-language-switcher";
import { SectionProfileCard } from "../components/profile/section-profile-card";
import { SectionProfileForm } from "../components/profile/section-profile-form";
import { SectionThemeSwitcher } from "../components/profile/section-theme-switcher";
import api from "../lib/api-client";
import { useAuthStore } from "../stores/auth.store";
import { useThemeStore } from "../stores/theme.store";
import { useToastStore } from "../stores/toast.store";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();
  const { showToast } = useToastStore();

  const [name, setName] = React.useState(user?.name || "");
  const [avatarEmoji, setAvatarEmoji] = React.useState(user?.avatar_emoji || "🦖");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Danger Zone States
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState("");
  const [resetting, setResetting] = React.useState(false);

  const handleUpdateProfile = async (selectedThemeName?: "Sakura" | "Duo" | "Light" | "Dark") => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const activeTheme = selectedThemeName || theme;
      const response = await api.put("/users/profile", {
        name,
        avatar_emoji: avatarEmoji,
        theme_preferences: { theme: activeTheme },
      });

      const updatedUser = response.data.user;
      setUser(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || t("profile.error_update", { defaultValue: "Failed to update settings." }));
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: "Sakura" | "Duo" | "Light" | "Dark") => {
    setTheme(newTheme);
    handleUpdateProfile(newTheme);
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      await api.delete("/users/reset-data");
      showToast(t("settings_page.reset_success"), "success");
      setShowConfirm(false);
      setConfirmInput("");
      
      // Reload page to show fresh status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      showToast(err.response?.data?.error || t("settings_page.reset_failed"), "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{t("nav.settings")}</h1>
        <p className="text-text-secondary font-semibold text-sm">{t("profile.profile_desc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <SectionProfileCard name={name} avatarEmoji={avatarEmoji} />

        {/* Profile Update Form */}
        <SectionProfileForm
          name={name}
          setName={setName}
          avatarEmoji={avatarEmoji}
          setAvatarEmoji={setAvatarEmoji}
          loading={loading}
          success={success}
          error={error}
          onUpdateProfile={() => handleUpdateProfile()}
        />
      </div>

      {/* Language Switcher block */}
      <SectionLanguageSwitcher />

      {/* Theme Switcher block */}
      <SectionThemeSwitcher onThemeChange={handleThemeChange} />

      {/* Danger Zone */}
      <div className="card-duo border-red-200 dark:border-red-950/40 bg-red-50/5 p-5 md:p-6 flex flex-col gap-4 mt-2">
        <div className="border-b-2 border-highlight pb-3">
          <h2 className="text-lg font-black text-red-500 flex items-center gap-2">
            <span>⚠️</span>
            <span>{t("settings_page.danger_zone")}</span>
          </h2>
          <p className="text-xs text-text-secondary font-semibold">
            {t("settings_page.danger_zone_desc")}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 max-w-xl">
            <h3 className="font-extrabold text-sm text-text-primary">
              {t("settings_page.reset_data_title")}
            </h3>
            <p className="text-xs font-semibold text-text-secondary leading-relaxed">
              {t("settings_page.reset_data_desc")}
            </p>
            {user?.role !== "husband" && (
              <p className="text-xs font-bold text-red-500/90 mt-1 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{t("settings_page.only_husband_allowed")}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => user?.role === "husband" && setShowConfirm(true)}
            disabled={user?.role !== "husband"}
            className={`btn-3d text-white font-extrabold text-xs tracking-wider uppercase shrink-0 py-2.5 px-4 ${
              user?.role === "husband"
                ? "bg-red-500 border-red-600 hover:bg-red-600 shadow-[0_4px_0_0_#b91c1c] active:translate-y-[2px] active:shadow-none cursor-pointer"
                : "bg-gray-300 border-gray-400 text-gray-500 shadow-none translate-y-0 opacity-50 cursor-not-allowed"
            }`}
          >
            {t("settings_page.reset_data_btn")}
          </button>
        </div>

        {/* Modal type-to-confirm */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="card-duo bg-card-surface border-border-color shadow-[0_6px_0_0_#1f2937] max-w-md w-full p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-black text-red-500">
                  {t("settings_page.confirm_title")}
                </h3>
                <p className="text-xs font-semibold text-text-secondary mt-1">
                  {t("settings_page.reset_data_desc")}
                </p>
              </div>

              <div className="flex flex-col gap-2 bg-highlight/50 p-3.5 rounded-xl border border-border-color">
                <label className="text-xs font-extrabold text-text-primary">
                  {t("settings_page.confirm_desc")}
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={t("settings_page.confirm_placeholder")}
                  className="w-full h-11 px-3 py-2 rounded-xl outline-none border-2 border-border-color bg-card-surface text-text-primary font-semibold text-sm focus-visible:border-red-500 uppercase"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2 border-t-2 border-highlight pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmInput("");
                  }}
                  className="px-4 py-2 bg-card-surface hover:bg-highlight border-2 border-border-color text-text-secondary font-bold text-xs uppercase rounded-xl transition-all cursor-pointer shadow-[0_2px_0_var(--border-color)] active:translate-y-[1px] active:shadow-none"
                >
                  {t("settings_page.cancel_btn")}
                </button>
                <button
                  type="button"
                  disabled={confirmInput.toUpperCase() !== "RESET" || resetting}
                  onClick={handleResetData}
                  className={`btn-3d text-xs font-extrabold px-4 py-2 text-white bg-red-500 border-red-600 shadow-[0_4px_0_0_#b91c1c] active:translate-y-[1px] active:shadow-none ${
                    confirmInput.toUpperCase() !== "RESET" ? "opacity-50 cursor-not-allowed shadow-none translate-y-0" : "cursor-pointer"
                  }`}
                >
                  {resetting ? "Resetting..." : t("settings_page.confirm_btn")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
