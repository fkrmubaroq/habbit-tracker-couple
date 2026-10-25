import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BellRing,
  Check,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { ThemeSwitcherSection } from "../components/ThemeSwitcher";
import { useSession } from "../hooks/use-session";
import { usePreferencesStore } from "../stores/preferences.store";
import { useToastStore } from "../stores/toast.store";
import { pomodoroService } from "../services/pomodoro.service";
import { FINANCE_APP_URL, GROCERY_APP_URL, HABIT_APP_URL } from "../services/session-url";

export const Route = createFileRoute("/settings")({
  component: PomodoroSettingsPage,
});

interface DurationForm {
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  long_break_interval: number;
  auto_start_break: boolean;
}

const FALLBACK_FORM: DurationForm = {
  focus_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  long_break_interval: 4,
  auto_start_break: true,
};

function NumberField({
  id,
  label,
  hint,
  min,
  max,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  min: number;
  max: number;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-black text-text-primary">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ""}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-xl border-2 border-border-color bg-highlight px-3.5 text-sm font-extrabold text-text-primary focus:border-primary focus:outline-none disabled:opacity-60"
      />
      {hint ? <span className="text-[10px] font-semibold text-text-secondary">{hint}</span> : null}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-border-color bg-highlight/60 p-3.5 text-left transition-all hover:border-primary/60 cursor-pointer"
    >
      <div className="flex flex-col">
        <span className="text-xs font-black text-text-primary">{label}</span>
        <span className="text-[10px] font-semibold text-text-secondary">{description}</span>
      </div>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full border-2 transition-all ${
          checked ? "border-primary bg-primary" : "border-border-color bg-card-surface"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.35rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function PomodoroSettingsPage() {
  const queryClient = useQueryClient();
  const { data: user } = useSession();
  const { showToast } = useToastStore();
  const { soundMuted, notificationsEnabled, setSoundMuted, setNotificationsEnabled } =
    usePreferencesStore();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["pomodoro-settings", user?.id],
    queryFn: () => pomodoroService.getSettings(user?.id),
    staleTime: 5 * 60_000,
  });

  const [form, setForm] = React.useState<DurationForm>(FALLBACK_FORM);
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  // Server values win once loaded; the form is only edited by the user after that.
  React.useEffect(() => {
    if (!settings) return;
    setForm({
      focus_minutes: settings.focus_minutes,
      short_break_minutes: settings.short_break_minutes,
      long_break_minutes: settings.long_break_minutes,
      long_break_interval: settings.long_break_interval,
      auto_start_break: settings.auto_start_break,
    });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (payload: DurationForm) => pomodoroService.updateSettings(payload),
    onSuccess: (saved) => {
      queryClient.setQueryData(["pomodoro-settings", user?.id], saved);
      showToast("Durasi default tersimpan & tersinkron ke perangkat lain", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const isDirty = React.useMemo(() => {
    if (!settings) return false;
    return (
      form.focus_minutes !== settings.focus_minutes ||
      form.short_break_minutes !== settings.short_break_minutes ||
      form.long_break_minutes !== settings.long_break_minutes ||
      form.long_break_interval !== settings.long_break_interval ||
      form.auto_start_break !== settings.auto_start_break
    );
  }, [form, settings]);

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      showToast("Browser ini tidak mendukung notifikasi", "error");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    setNotificationsEnabled(result === "granted");
    showToast(
      result === "granted" ? "Notifikasi diizinkan" : "Izin notifikasi tidak diberikan",
      result === "granted" ? "success" : "error"
    );
  };

  const clampAndSave = () => {
    saveMutation.mutate({
      focus_minutes: Math.min(180, Math.max(1, Math.round(form.focus_minutes || 1))),
      short_break_minutes: Math.min(60, Math.max(1, Math.round(form.short_break_minutes || 1))),
      long_break_minutes: Math.min(120, Math.max(1, Math.round(form.long_break_minutes || 1))),
      long_break_interval: Math.min(12, Math.max(1, Math.round(form.long_break_interval || 1))),
      auto_start_break: form.auto_start_break,
    });
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="relative overflow-hidden bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="h-13 w-13 rounded-2xl bg-red-100 border-2 border-red-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
            ⚙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                Pengaturan Pomodoro
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                Pribadi
              </span>
            </div>
            <p className="text-xs font-bold text-text-secondary mt-0.5">
              Durasi tersimpan di akun (sinkron antar device), preferensi suara & notifikasi per device.
            </p>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-rose-600" />
          <h2 className="text-base font-black text-text-primary">Akun</h2>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border-2 border-border-color bg-highlight p-3.5">
          {user?.avatar_image ? (
            <img src={user.avatar_image} alt={user.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <span className="text-2xl">{user?.avatar_emoji || "🦖"}</span>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-text-primary">{user?.name}</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
              {user?.role === "husband" ? "Suami" : "Istri"} · Data pomodoro pribadi
            </span>
          </div>
        </div>
        <p className="mt-3 text-[11px] font-semibold leading-relaxed text-text-secondary">
          Sesi, statistik, dan durasi di app ini hanya bisa dibaca oleh akunmu sendiri. Pasangan
          tidak melihat progress fokusmu.
        </p>
      </div>

      {/* Durations */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 mb-1">
          <Timer className="h-5 w-5 text-rose-600" />
          <h2 className="text-base font-black text-text-primary">Durasi default</h2>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-text-secondary" /> : null}
        </div>
        <p className="mb-4 text-[11px] font-semibold text-text-secondary">
          Dipakai saat timer idle. Preset di halaman Timer akan memperbarui nilai ini.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumberField
            id="focus-minutes"
            label="Fokus (menit)"
            hint="1–180 menit"
            min={1}
            max={180}
            value={form.focus_minutes}
            disabled={isLoading}
            onChange={(value) => setForm((prev) => ({ ...prev, focus_minutes: value }))}
          />
          <NumberField
            id="short-break-minutes"
            label="Break pendek (menit)"
            hint="1–60 menit"
            min={1}
            max={60}
            value={form.short_break_minutes}
            disabled={isLoading}
            onChange={(value) => setForm((prev) => ({ ...prev, short_break_minutes: value }))}
          />
          <NumberField
            id="long-break-minutes"
            label="Long break (menit)"
            hint="1–120 menit"
            min={1}
            max={120}
            value={form.long_break_minutes}
            disabled={isLoading}
            onChange={(value) => setForm((prev) => ({ ...prev, long_break_minutes: value }))}
          />
          <NumberField
            id="long-break-interval"
            label="Long break tiap … sesi"
            hint="1–12 sesi fokus"
            min={1}
            max={12}
            value={form.long_break_interval}
            disabled={isLoading}
            onChange={(value) => setForm((prev) => ({ ...prev, long_break_interval: value }))}
          />
        </div>

        <div className="mt-3">
          <Toggle
            label="Break mulai otomatis"
            description="Setelah sesi fokus selesai, break langsung berjalan. Sesi fokus berikutnya tetap menunggu tombol Mulai."
            checked={form.auto_start_break}
            onChange={(checked) => setForm((prev) => ({ ...prev, auto_start_break: checked }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="3d"
            onClick={clampAndSave}
            disabled={!isDirty || saveMutation.isPending || isLoading}
            className="flex items-center gap-2 font-black"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Simpan durasi</span>
          </Button>
          {isDirty ? (
            <span className="text-[11px] font-bold text-amber-700">Ada perubahan belum disimpan</span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <Check className="h-3 w-3" /> Tersimpan
            </span>
          )}
        </div>
      </div>

      {/* Device preferences */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 mb-1">
          <BellRing className="h-5 w-5 text-rose-600" />
          <h2 className="text-base font-black text-text-primary">Notifikasi & suara</h2>
        </div>
        <p className="mb-4 text-[11px] font-semibold text-text-secondary">
          Pengaturan ini hanya berlaku di perangkat ini.
        </p>

        <div className="flex flex-col gap-2.5">
          <Toggle
            label={soundMuted ? "Suara: mati" : "Suara: nyala"}
            description="Bunyi singkat saat sesi fokus atau break selesai."
            checked={!soundMuted}
            onChange={(checked) => setSoundMuted(!checked)}
          />

          <div className="rounded-2xl border-2 border-border-color bg-highlight/60 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-black text-text-primary">Notifikasi browser</span>
                <span className="text-[10px] font-semibold text-text-secondary">
                  Muncul saat sesi selesai walau tab sedang di background.
                </span>
                <span className="mt-1 text-[10px] font-black uppercase tracking-wider text-text-secondary">
                  Status:{" "}
                  {permission === "granted"
                    ? "diizinkan"
                    : permission === "denied"
                      ? "diblokir browser"
                      : permission === "unsupported"
                        ? "tidak didukung"
                        : "belum diminta"}
                </span>
              </div>
              {permission === "granted" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 font-black"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  {notificationsEnabled ? "Matikan" : "Nyalakan"}
                </Button>
              ) : (
                <Button
                  variant="3d-secondary"
                  size="sm"
                  className="shrink-0 font-black"
                  disabled={permission === "unsupported"}
                  onClick={handleRequestPermission}
                >
                  Minta izin
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] font-semibold leading-relaxed text-text-secondary">
          Catatan jujur: browser tidak punya penjadwal notifikasi yang andal. Kalau browser benar-benar
          ditutup, notifikasi tidak dijamin muncul — tapi timer tetap akurat dan sesi tetap tercatat
          saat app dibuka lagi.
        </p>
      </div>

      {/* Theme */}
      <ThemeSwitcherSection />

      {/* Cross-app shortcuts */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-black text-text-primary">Pintas Menu Lain</h2>
        </div>

        <div className="flex flex-col gap-2">
          {[
            {
              emoji: "💖",
              title: "Habit Pasutri",
              desc: "Buka pelacak kebiasaan & streak utama",
              href: HABIT_APP_URL,
            },
            {
              emoji: "🛒",
              title: "Grocery List",
              desc: "Daftar belanjaan bersama pasangan",
              href: GROCERY_APP_URL,
            },
            {
              emoji: "💰",
              title: "Keuangan Pasutri",
              desc: "Catat pengeluaran & tabungan bersama",
              href: FINANCE_APP_URL,
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                window.location.href = item.href;
              }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-highlight border-2 border-border-color hover:border-primary transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-text-primary">{item.title}</span>
                  <span className="text-xs font-medium text-text-secondary">{item.desc}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-text-secondary" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-text-secondary">
        {soundMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        Suara {soundMuted ? "mati" : "nyala"} · Notifikasi{" "}
        {notificationsEnabled && permission === "granted" ? "aktif" : "nonaktif"}
      </div>
    </div>
  );
}
