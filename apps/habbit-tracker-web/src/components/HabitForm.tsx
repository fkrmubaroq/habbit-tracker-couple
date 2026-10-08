import * as React from "react";
import { useTranslation } from "react-i18next";
import { useCreateHabit, useUpdateHabit } from "../hooks/use-habits";
import { useToastStore } from "../stores/toast.store";
import type { Habit } from "../types/index";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";

const EMOJIS = ["🏋️‍♂️", "📖", "🧘‍♂️", "💧", "🌹", "📊", "🍱", "🩺", "🧹", "🧠", "🏃‍♂️", "🥑", "🛌"];

interface HabitFormProps {
  editingHabit: Habit | null;
  template: any | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function HabitForm({
  editingHabit,
  template,
  onSuccess,
  onCancel,
}: HabitFormProps) {
  const { t } = useTranslation();
  const { showToast } = useToastStore();

  // Mutations
  const createMutation = useCreateHabit();
  const updateMutation = useUpdateHabit();

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form States
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconEmoji, setIconEmoji] = React.useState("🏋️‍♂️");
  const [frequency, setFrequency] = React.useState<"daily" | "weekly" | "monthly">("daily");
  const [isShared, setIsShared] = React.useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIconEmoji("🏋️‍♂️");
    setFrequency("daily");
    setIsShared(false);
  }

  React.useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || "");
      setIconEmoji(editingHabit.icon_emoji);
      setFrequency(editingHabit.frequency);
      setIsShared(editingHabit.is_shared);
    } else if (template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setIconEmoji(template.icon_emoji);
      setFrequency(template.frequency);
      setIsShared(false);
    } else {
      resetForm()
    }
  }, [editingHabit, template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;

    const habitData = {
      title,
      description: description || null,
      icon_emoji: iconEmoji,
      frequency,
      is_shared: isShared,
      is_active: true,
    };

    if (editingHabit) {
      updateMutation.mutate(
        {
          id: editingHabit.id,
          ...habitData,
          is_active: editingHabit.is_active,
        },
        {
          onSuccess: () => {
            showToast(t("habits.edit_success", { defaultValue: "Habit successfully updated!" }), "success");
            onSuccess();
            resetForm();
          },
          onError: () => {
            showToast(t("habits.edit_failed", { defaultValue: "Failed to update habit. Please try again." }), "error");
          },
        }
      );
    } else {
      createMutation.mutate(habitData, {
        onSuccess: () => {
          showToast(t("habits.add_success", { defaultValue: "Habit successfully added!" }), "success");
          onSuccess();
          resetForm();
        },
        onError: () => {
          showToast(t("habits.add_failed", { defaultValue: "Failed to add habit. Please try again." }), "error");
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-card-surface border-2 border-border-color shadow-[0_4px_0_0_var(--border-color)] p-6 rounded-2xl max-w-md mx-auto w-full">
      <div>
        <h3 className="text-lg font-black text-text-primary">
          {editingHabit ? t("habits.edit_habit") : t("habits.create_habit")}
        </h3>
        <p className="text-xs text-text-secondary font-semibold mt-0.5">
          {editingHabit
            ? t("habits.update_habit_desc", { defaultValue: "Update your habit configuration." })
            : t("habits.new_habit_desc", { defaultValue: "Define a new routine to build consistency." })}
        </p>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-extrabold text-text-primary">{t("habits.habit_title")}</label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Drink 2L Water"
          required
          disabled={isPending}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-extrabold text-text-primary">{t("habits.description_optional")}</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Carry a 1L bottle and fill it twice a day"
          disabled={isPending}
        />
      </div>

      {/* Frequency */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-extrabold text-text-primary">{t("habits.frequency")}</label>
        <Select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as any)}
          disabled={isPending}
        >
          <option value="daily">{t("dashboard.daily")}</option>
          <option value="weekly">{t("dashboard.weekly")}</option>
          <option value="monthly">{t("dashboard.monthly")}</option>
        </Select>
      </div>

      {/* Icon Emoji Picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-extrabold text-text-primary">{t("habits.choose_emoji")}</label>
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-highlight rounded-xl border-2 border-border-color">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIconEmoji(emoji)}
              disabled={isPending}
              className={`h-9 w-9 text-xl flex items-center justify-center rounded-lg border-2 transition-all ${
                isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } ${iconEmoji === emoji ? "bg-primary border-text-primary shadow-[0_2px_0_0_#1f2937]" : "border-transparent hover:bg-card-surface"
                }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Shared toggle */}
      <div className="flex items-center justify-between bg-highlight p-3 rounded-xl border-2 border-border-color mt-1">
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-text-primary">{t("habits.shared_goal_partner")}</span>
          <span className="text-[10px] text-text-secondary font-semibold">{t("habits.both_users_log")}</span>
        </div>
        <input
          type="checkbox"
          checked={isShared}
          onChange={(e) => setIsShared(e.target.checked)}
          disabled={isPending}
          className="h-5 w-5 rounded border-2 border-text-primary accent-primary cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex justify-end gap-2.5 mt-2 border-t-2 border-highlight pt-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" variant="3d" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {editingHabit ? t("common.saving", { defaultValue: "Menyimpan..." }) : t("common.adding", { defaultValue: "Menambah..." })}
            </span>
          ) : (
            editingHabit ? t("habits.save_changes") : t("habits.add_habit")
          )}
        </Button>
      </div>
    </form>
  );
}
