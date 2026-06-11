import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface SectionProfileFormProps {
  name: string;
  setName: (name: string) => void;
  avatarEmoji: string;
  setAvatarEmoji: (emoji: string) => void;
  loading: boolean;
  success: boolean;
  error: string | null;
  onUpdateProfile: () => void;
}

const EMOJIS = ["🦖", "🦄", "🐶", "🐱", "🦊", "🐼", "🐻", "🐰", "🐨", "🦁", "🐵", "🐙", "🦀"];

export function SectionProfileForm({
  name,
  setName,
  avatarEmoji,
  setAvatarEmoji,
  loading,
  success,
  error,
  onUpdateProfile,
}: SectionProfileFormProps) {
  const { t } = useTranslation();

  return (
    <section className="card-duo md:col-span-2 flex flex-col gap-4">
      <h2 className="text-base font-bold text-text-primary border-text-primary pb-1.5 flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <span>{t("profile.edit_info")}</span>
      </h2>

      {success && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-600 rounded-xl p-3 text-sm font-bold animate-pulse">
          {t("profile.success_update")}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-500 text-red-600 rounded-xl p-3 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-extrabold text-text-primary">{t("profile.display_name")}</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Romeo"
          />
        </div>

        {/* Avatar Emoji picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-extrabold text-text-primary">{t("register.emoji_label")}</label>
          <div className="flex flex-wrap gap-2 p-3 bg-highlight rounded-xl border-2 border-border-color">
            {EMOJIS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAvatarEmoji(emoji)}
                className={`text-2xl h-10 w-10 flex items-center justify-center rounded-lg border-2 transition-all cursor-pointer ${avatarEmoji === emoji
                  ? "bg-primary border-text-primary shadow-[0_2px_0_0_#1f2937]"
                  : "border-transparent hover:bg-card-surface"
                  }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={onUpdateProfile}
          variant="3d"
          className="self-start mt-2"
          disabled={loading}
        >
          {loading ? t("common.loading") : t("common.save_changes")}
        </Button>
      </div>
    </section>
  );
}
