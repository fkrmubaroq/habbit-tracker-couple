import { createFileRoute } from "@tanstack/react-router";
import { Edit, Heart, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { HabitForm } from "../components/HabitForm";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { useDeleteHabit, useMyHabits } from "../hooks/use-habits";
import { usePartnerProfile } from "../hooks/use-partner";
import { useAuthStore } from "../stores/auth.store";
import { useToastStore } from "../stores/toast.store";
import type { Habit } from "../types/index";

export const Route = createFileRoute("/list-habits")({
  component: ListHabitsComponent,
});

function ListHabitsComponent() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: partner } = usePartnerProfile();
  const { showToast } = useToastStore();

  const { data: habits = [], isLoading } = useMyHabits();
  const deleteMutation = useDeleteHabit();

  // Search & Tab States
  const [activeTab, setActiveTab] = React.useState<"personal" | "couple">("personal");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingHabit, setEditingHabit] = React.useState<Habit | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm(t("habits.delete_habit_confirm", { defaultValue: "Are you sure you want to delete this habit?" }))) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          showToast(t("list_habits.delete_success", { defaultValue: "Habit successfully deleted!" }), "success");
        },
        onError: () => {
          showToast(t("list_habits.delete_failed", { defaultValue: "Failed to delete habit." }), "error");
        },
      });
    }
  };

  // Filter list
  const filteredHabits = habits.filter((habit) => {
    // Tab filtering
    const matchesTab = activeTab === "couple" ? habit.is_shared : !habit.is_shared;
    if (!matchesTab) return false;

    // Search query filtering
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      habit.title.toLowerCase().includes(q) ||
      (habit.description && habit.description.toLowerCase().includes(q))
    );
  });

  const partnerName = partner?.name || t("dashboard.shared");

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Heart className="h-8 w-8 text-primary animate-bounce fill-current" />
          <span className="font-bold text-text-secondary">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          {t("list_habits.title")}
        </h1>
        <p className="text-text-secondary font-semibold text-sm">
          {t("list_habits.desc")}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
        <Input
          type="text"
          placeholder={t("list_habits.search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 pr-4 py-2.5 w-full bg-card-surface border-2 border-border-color focus:border-text-primary rounded-2xl"
        />
      </div>

      {/* Tabs Selector */}
      <div className="tabs-duo-container">
        <button
          onClick={() => setActiveTab("personal")}
          className={`tab-duo-btn ${activeTab === "personal" ? "active" : ""}`}
        >
          {t("list_habits.tab_personal")}
        </button>
        <button
          onClick={() => setActiveTab("couple")}
          className={`tab-duo-btn ${activeTab === "couple" ? "active" : ""}`}
        >
          {t("list_habits.tab_couple")}
        </button>
      </div>

      {/* Grid List */}
      {filteredHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card-surface border-2 border-dashed border-text-secondary rounded-2xl text-center">
          <span className="text-4xl mb-2">📋</span>
          <p className="font-bold text-text-primary">
            {activeTab === "couple"
              ? t("list_habits.no_couple_habits")
              : t("list_habits.no_personal_habits")}
          </p>
          <p className="text-xs text-text-secondary font-semibold mt-1">
            {activeTab === "couple"
              ? t("list_habits.no_couple_habits_desc")
              : t("list_habits.no_personal_habits_desc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => {
            const isOwner = habit.user_id === user?.id;

            return (
              <div
                key={habit.id}
                className="card-duo flex flex-col justify-between p-5 bg-card-surface min-h-[180px]"
              >
                <div className="flex flex-col gap-3">
                  {/* Header info */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-highlight h-12 w-12 flex items-center justify-center rounded-xl border-2 border-border-color shrink-0">
                      {habit.icon_emoji}
                    </span>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-extrabold text-sm text-text-primary truncate">
                        {habit.title}
                      </span>
                      <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider mt-0.5">
                        {t("dashboard." + habit.frequency)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {habit.description && (
                    <p className="text-xs text-text-secondary font-semibold leading-relaxed line-clamp-2">
                      {habit.description}
                    </p>
                  )}
                </div>

                {/* Footer and Badges */}
                <div className="flex flex-col gap-3.5 mt-4">
                  <div className="flex justify-between items-center border-t-2 border-highlight pt-3">
                    <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wide">
                      {habit.is_shared
                        ? t("list_habits.couple_badge")
                        : t("list_habits.personal_badge")}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border-2 ${habit.is_active
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-highlight border-border-color text-text-secondary"
                        }`}
                    >
                      {habit.is_active
                        ? t("list_habits.status_active")
                        : t("list_habits.status_archived")}
                    </span>
                  </div>

                  {/* Conditional Actions */}
                  {isOwner ? (
                    <div className="flex gap-2.5">
                      <Button
                        onClick={() => setEditingHabit(habit)}
                        variant="outline"
                        className="w-1/2 text-xs py-1.5 h-9 font-extrabold flex items-center justify-center gap-1.5"
                      >
                        <Edit className="h-4 w-4" />
                        <span>{t("common.edit")}</span>
                      </Button>
                      <Button
                        onClick={() => handleDelete(habit.id)}
                        variant="outline"
                        className="w-1/2 text-xs py-1.5 h-9 font-extrabold text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{t("common.delete")}</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 py-2">
                      <span>👥</span>
                      <span className="truncate">
                        {t("dashboard.partner_progress", { name: partnerName })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Habit Modal Dialog */}
      <Dialog
        open={editingHabit !== null}
        onOpenChange={(open) => {
          if (!open) setEditingHabit(null);
        }}
      >
        <DialogContent className="max-w-md">
          {editingHabit && (
            <HabitForm
              editingHabit={editingHabit}
              template={null}
              onSuccess={() => {
                setEditingHabit(null);
              }}
              onCancel={() => setEditingHabit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
