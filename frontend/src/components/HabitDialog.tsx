import * as React from "react";
import { HabitForm } from "./HabitForm";
import type { Habit } from "../types/index";

interface HabitDialogProps {
  editingHabit: Habit | null;
  template: any | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

/**
 * HabitDialog component refactored to be content-only (no Dialog/Modal wrapper).
 * It displays the HabitForm inline as regular page content.
 */
export function HabitDialog({
  editingHabit,
  template,
  onSuccess,
  onCancel,
}: HabitDialogProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <HabitForm
        editingHabit={editingHabit}
        template={template}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </div>
  );
}
