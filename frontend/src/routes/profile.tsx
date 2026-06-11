import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/auth.store";
import { useThemeStore } from "../stores/theme.store";
import api from "../lib/api-client";
import { SectionProfileCard } from "../components/profile/section-profile-card";
import { SectionProfileForm } from "../components/profile/section-profile-form";
import { SectionLanguageSwitcher } from "../components/profile/section-language-switcher";
import { SectionThemeSwitcher } from "../components/profile/section-theme-switcher";

export const Route = createFileRoute("/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  const [name, setName] = React.useState(user?.name || "");
  const [avatarEmoji, setAvatarEmoji] = React.useState(user?.avatar_emoji || "🦖");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      setError(err.response?.data?.error || t("profile.error_update", { defaultValue: "Failed to update profile." }));
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: "Sakura" | "Duo" | "Light" | "Dark") => {
    setTheme(newTheme);
    handleUpdateProfile(newTheme);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">{t("nav.profile")}</h1>
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
    </div>
  );
}

