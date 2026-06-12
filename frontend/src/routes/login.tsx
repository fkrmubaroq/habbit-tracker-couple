import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, Lock, User as UserIcon } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import api from "../lib/api-client";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/auth.store";
import { useThemeStore } from "../stores/theme.store";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

// Statically typed schema for form structure
const staticLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type LoginFormValues = z.infer<typeof staticLoginSchema>;

function LoginComponent() {
  const { login, isAuthenticated } = useAuthStore();
  const { setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { t } = useTranslation();

  // Dynamic schema for localized error messages
  const loginSchema = React.useMemo(() => {
    return z.object({
      username: z.string().min(1, t("validation.username_required")),
      password: z.string().min(1, t("validation.password_required")),
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
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", data);
      const { user, token } = response.data;

      // Auto-set the correct user theme preference
      if (user.theme_preferences?.theme) {
        setTheme(user.theme_preferences.theme);
      } else {
        setTheme(user.role === "husband" ? "Duo" : "Sakura");
      }

      login(user, token);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(
        err.response?.data?.error || t("login.connection_failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card-surface border-2 border-border-color rounded-2xl p-6 sm:p-8 shadow-[0_4px_0_0_var(--border-color)] animate-float">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mb-3 text-primary relative">
          <img src="/favicon/favicon.svg" alt="Logo" className="size-20" />
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">{t("login.welcome_title")}</h1>
        <p className="text-text-secondary text-sm font-semibold mt-1">{t("login.welcome_subtitle")}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border-2 border-red-500 text-red-600 rounded-xl p-3 text-sm font-bold mb-4 animate-shake">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-extrabold text-text-primary">{t("common.username")}</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-[50%] translate-y-[-50%] h-5 w-5 text-text-secondary z-10" />
            <Input
              type="text"
              placeholder="e.g. romeo"
              className={cn("pl-10 pr-4 py-2.5", errors.username ? "border-red-500" : "")}
              {...register("username")}
            />
          </div>
          {errors.username && (
            <span className="text-xs font-bold text-red-500">{errors.username.message}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-extrabold text-text-primary">{t("common.password")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-[50%] translate-y-[-50%] h-5 w-5 text-text-secondary z-10" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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

        {/* Submit */}
        <Button
          type="submit"
          variant="3d"
          className="w-full mt-2"
          disabled={loading}
        >
          {loading ? t("login.logging_in") : t("common.login")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm font-bold text-text-secondary">
          {t("login.signup_prompt")}{" "}
          <Link to="/register" className="text-primary hover:underline font-extrabold">
            {t("login.signup_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
