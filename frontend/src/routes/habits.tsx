import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { HabitDialog } from "../components/HabitDialog";
import { Button } from "../components/ui/button";
import {
  useDeleteHabit,
  useHabitTemplates,
  useMyHabits,
} from "../hooks/use-habits";
import { useAuthStore } from "../stores/auth.store";
import type { Habit } from "../types/index";

export const Route = createFileRoute("/habits")({
  component: HabitsComponent,
});

function HabitsComponent() {
  const { user } = useAuthStore();
  const { data: habits = [] } = useMyHabits();
  const { data: templates = [] } = useHabitTemplates();
  const { t } = useTranslation();

  // Mutations
  const deleteMutation = useDeleteHabit();

  // Tab and form states
  const [activeTab, setActiveTab] = React.useState<"templates" | "create">("templates");
  const [editingHabit, setEditingHabit] = React.useState<Habit | null>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState<any | null>(null);

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setSelectedTemplate(null);
    setActiveTab("create");
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setSelectedTemplate(null);
    setActiveTab("create");
  };

  const handleOpenTemplate = (tpl: any) => {
    setEditingHabit(null);
    setSelectedTemplate(tpl);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("habits.delete_habit_confirm"))) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setEditingHabit(null);
    setSelectedTemplate(null);
    setActiveTab("templates");
  };

  return (
    <div className="flex flex-col gap-6 mb-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">{t("habits.manage_habits")}</h1>
          <p className="text-text-secondary font-semibold text-sm">{t("habits.manage_habits_desc")}</p>
        </div>

      </div>

      {/* Tabs Selector */}
      <div className="tabs-duo-container">
        <button
          onClick={() => {
            setActiveTab("templates");
            setEditingHabit(null);
            setSelectedTemplate(null);
          }}
          className={`tab-duo-btn ${activeTab === "templates" ? "active" : ""}`}
        >
          {t("habits.quick_templates", { defaultValue: "Templates" })}
        </button>
        <button
          onClick={() => {
            setActiveTab("create");
            setEditingHabit(null);
            setSelectedTemplate(null);
          }}
          className={`tab-duo-btn ${activeTab === "create" ? "active" : ""}`}
        >
          {editingHabit
            ? t("habits.edit_habit", { defaultValue: "Edit Habit" })
            : t("habits.create_habit", { defaultValue: "Create Habit" })}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "templates" ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {selectedTemplate ? (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-highlight p-3 rounded-2xl border-2 border-text-primary">
                <span className="font-extrabold text-sm text-text-primary">
                  {t("habits.using_template", { defaultValue: "Using template" })}: {selectedTemplate.title}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                  className="text-xs h-8 py-0"
                >
                  {t("common.cancel")}
                </Button>
              </div>
              <HabitDialog
                editingHabit={null}
                template={selectedTemplate}
                onSuccess={handleFormSuccess}
                onCancel={() => setSelectedTemplate(null)}
              />
            </div>
          ) : (
            /* Preset Templates Picker */
            <section className="card-duo flex flex-col gap-4">
              <div>
                <h2 className="font-extrabold text-sm text-text-primary flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-primary" />
                  <span>{t("habits.quick_templates")}</span>
                </h2>
                <p className="text-xs text-text-secondary font-semibold mt-0.5">{t("habits.templates_desc")}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {templates.slice(0, 8).map((tpl, i) => (
                  <div
                    key={i}
                    onClick={() => handleOpenTemplate(tpl)}
                    className="border-2 border-border-color rounded-xl p-3 flex flex-col items-center text-center gap-1.5 cursor-pointer bg-card-surface hover:bg-highlight hover:border-text-primary hover:shadow-[0_2px_0_0_#1f2937] transition-all"
                  >
                    <span className="text-2xl">{tpl.icon_emoji}</span>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-xs text-text-primary line-clamp-1">{tpl.title}</span>
                      <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">{t("dashboard." + tpl.frequency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* Create / Edit Habit Form */
        <div className="flex justify-center w-full animate-in fade-in zoom-in-95 duration-150">
          <HabitDialog
            editingHabit={editingHabit}
            template={null}
            onSuccess={handleFormSuccess}
            onCancel={handleFormSuccess}
          />
        </div>
      )}


    </div>
  );
}
