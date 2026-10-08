import { Camera, Loader2, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api-client";
import { useAuthStore } from "../../stores/auth.store";

interface SectionProfileCardProps {
  name: string;
  avatarEmoji: string;
}

export function SectionProfileCard({ name, avatarEmoji }: SectionProfileCardProps) {
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAvatarClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Validate size (limit to 2MB to keep base64 string manageable)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const response = await api.put("/users/profile", {
          name: name || user?.name,
          avatar_emoji: avatarEmoji || user?.avatar_emoji,
          avatar_image: base64String,
        });

        const updatedUser = response.data.user;
        setUser(updatedUser);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to upload avatar image.");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError("Error reading file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file selector
    if (uploading) return;

    setUploading(true);
    setError(null);

    try {
      const response = await api.put("/users/profile", {
        name: name || user?.name,
        avatar_emoji: avatarEmoji || user?.avatar_emoji,
        avatar_image: null,
      });

      const updatedUser = response.data.user;
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove avatar image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="card-duo md:col-span-1 flex flex-col items-center justify-center text-center p-6 gap-3 bg-highlight/30">
      <div
        onClick={handleAvatarClick}
        className="relative group h-24 w-24 rounded-3xl cursor-pointer overflow-hidden border-3 border-primary bg-card-surface flex items-center justify-center select-none"
        style={{
          boxShadow: "0 4px 0 color-mix(in srgb, var(--primary) 80%, #000)"
        }}
      >
        {user?.avatar_image ? (
          <img
            src={user.avatar_image}
            alt={name || user?.name}
            className="h-full w-full object-cover animate-fade-in"
          />
        ) : (
          <span className="text-6xl">{avatarEmoji}</span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity duration-200">
          <Camera className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            {user?.avatar_image ? t("profile.change", { defaultValue: "Change" }) : t("profile.upload", { defaultValue: "Upload" })}
          </span>
        </div>

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Remove Image Button if image exists */}
      {user?.avatar_image && !uploading && (
        <button
          onClick={handleRemoveImage}
          className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-red-500 hover:text-red-600 transition-colors border border-red-500/20 hover:border-red-500/50 bg-red-50/50 px-2.5 py-1 rounded-xl cursor-pointer mt-1"
        >
          <Trash2 className="h-3 w-3" />
          {t("profile.remove_photo", { defaultValue: "Remove Photo" })}
        </button>
      )}

      {error && (
        <span className="text-[10px] text-red-500 font-bold max-w-[150px] leading-tight mt-1">
          {error}
        </span>
      )}

      <div className="flex flex-col gap-1 mt-1">
        <span className="font-extrabold text-lg text-text-primary">{name || user?.name}</span>
        <span className="text-[10px] bg-primary/20 text-text-primary border border-text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider self-center mt-1">
          {user?.role === "husband" ? t("common.husband") : t("common.wife")}
        </span>
      </div>
      <p className="text-[10px] text-text-secondary font-extrabold uppercase mt-2 border-t-2 border-highlight pt-2 w-full">
        {t("common.username")}: {user?.username}
      </p>
    </section>
  );
}
