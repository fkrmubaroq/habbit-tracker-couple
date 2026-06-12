import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import api from "../lib/api-client";
import { useAuthStore } from "../stores/auth.store";
import { useThemeStore } from "../stores/theme.store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";
import { Heart, Lock, User as UserIcon, AlertCircle, Smile, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterComponent,
});

// Statically typed schema for form structure
const staticRegisterSchema = z.object({
  username: z.string(),
  password: z.string(),
  name: z.string(),
  avatar_emoji: z.string(),
  role: z.enum(["husband", "wife"]),
});

type RegisterFormValues = z.infer<typeof staticRegisterSchema>;

const EMOJI_OPTIONS = ["🦖", "🦄", "🐶", "🐱", "🦊", "🐼", "🐻", "🐰", "🐨", "🦁", "🐵", "🐙"];

function RegisterComponent() {
  const { login, isAuthenticated } = useAuthStore();
  const { setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<"husband" | "wife">("husband");
  const [selectedEmoji, setSelectedEmoji] = React.useState("🦖");
  const { t } = useTranslation();

  // Dynamic validation schema bound to i18n translator
  const registerSchema = React.useMemo(() => {
    return z.object({
      username: z.string().min(3, t("validation.username_min")).max(50),
      password: z.string().min(6, t("validation.password_min")),
      name: z.string().min(1, t("validation.name_required")).max(100),
      avatar_emoji: z.string().min(1, t("register.emoji_label")),
      role: z.enum(["husband", "wife"]),
    });
  }, [t]);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "husband",
      avatar_emoji: "🦖",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register", data);
      const { user, token } = response.data;
      
      // Auto-set the correct user theme preference
      setTheme(user.role === "husband" ? "Duo" : "Sakura");
      
      login(user, token);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(
        err.response?.data?.error || t("register.limit_reached")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: "husband" | "wife") => {
    setSelectedRole(role);
    setValue("role", role);
    
    // Auto emoji recommendation
    const recommendedEmoji = role === "husband" ? "🦖" : "🦄";
    setSelectedEmoji(recommendedEmoji);
    setValue("avatar_emoji", recommendedEmoji);
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setValue("avatar_emoji", emoji);
  };

  return (
    <div className="w-full max-w-lg bg-card-surface border-2 border-text-primary rounded-2xl p-6 sm:p-8 shadow-[0_6px_0_0_#1f2937]">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="h-14 w-14 bg-primary/20 border-2 border-text-primary rounded-full flex items-center justify-center mb-3 text-primary">
          <Heart className="h-7 w-7 text-primary fill-current" />
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">{t("register.create_title")}</h1>
        <p className="text-text-secondary text-sm font-semibold mt-1">{t("register.create_subtitle")}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border-2 border-red-500 text-red-600 rounded-xl p-3 text-sm font-bold mb-4 animate-shake">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-extrabold text-text-primary">{t("common.name")}</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-[50%] translate-y-[-50%] h-5 w-5 text-text-secondary z-10" />
            <Input
              type="text"
              placeholder="e.g. Romeo / Juliet"
              className={cn("pl-10 pr-4 py-2.5", errors.name ? "border-red-500" : "")}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <span className="text-xs font-bold text-red-500">{errors.name.message}</span>
          )}
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-extrabold text-text-primary">{t("common.username")}</label>
          <Input
            type="text"
            placeholder="e.g. romeo123"
            className={cn("px-4 py-2.5", errors.username ? "border-red-500" : "")}
            {...register("username")}
          />
          {errors.username && (
            <span className="text-xs font-bold text-red-500">{errors.username.message}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-extrabold text-text-primary">{t("common.password")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-[50%] translate-y-[-50%] h-5 w-5 text-text-secondary z-10" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              className={cn("pl-10 pr-10 py-2.5", errors.password ? "border-red-500" : "")}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[50%] translate-y-[-50%] text-text-secondary hover:text-text-primary focus:outline-none z-10 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs font-bold text-red-500">{errors.password.message}</span>
          )}
        </div>

        {/* Role Selector Card */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-extrabold text-text-primary">{t("register.role_label")}</label>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => handleRoleSelect("husband")}
              className={`border-2 rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                selectedRole === "husband"
                  ? "bg-primary/10 border-primary shadow-[0_3px_0_0_var(--primary)] scale-102"
                  : "border-border-color bg-card-surface hover:bg-highlight"
              }`}
            >
              <span className="text-3xl">🦖</span>
              <span className="font-bold text-sm text-text-primary">{t("common.husband")}</span>
              <span className="text-[10px] text-text-secondary font-semibold">{t("register.husband_desc")}</span>
            </div>

            <div
              onClick={() => handleRoleSelect("wife")}
              className={`border-2 rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                selectedRole === "wife"
                  ? "bg-primary/10 border-primary shadow-[0_3px_0_0_var(--primary)] scale-102"
                  : "border-border-color bg-card-surface hover:bg-highlight"
              }`}
            >
              <span className="text-3xl">🦄</span>
              <span className="font-bold text-sm text-text-primary">{t("common.wife")}</span>
              <span className="text-[10px] text-text-secondary font-semibold">{t("register.wife_desc")}</span>
            </div>
          </div>
        </div>

        {/* Emoji Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-extrabold text-text-primary">{t("register.emoji_label")}</label>
          <div className="flex flex-wrap gap-2 justify-center bg-highlight p-3 rounded-xl border-2 border-text-primary">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
                className={`text-2xl h-10 w-10 flex items-center justify-center rounded-lg border-2 transition-all cursor-pointer ${
                  selectedEmoji === emoji
                    ? "bg-primary border-text-primary shadow-[0_2px_0_0_#1f2937]"
                    : "border-transparent hover:bg-card-surface"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="3d"
          className="w-full mt-2"
          disabled={loading}
        >
          {loading ? t("register.creating_account") : t("register.create_and_connect")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm font-bold text-text-secondary">
          {t("register.login_prompt")}{" "}
          <Link to="/login" className="text-primary hover:underline font-extrabold">
            {t("register.login_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
