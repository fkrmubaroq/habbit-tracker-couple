import React from "react";
import { AlertCircle, Tag, Trash2, Edit2 } from "lucide-react";
import { FinanceBudget } from "@repo/types";
import { Card, Button } from "./ui";

interface BudgetCardProps {
  budget: FinanceBudget;
  onEdit?: (budget: FinanceBudget) => void;
  onDelete?: (id: string) => void;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const amount = budget.amount;
  const spent = budget.spent || 0;
  const remaining = budget.remaining !== undefined ? budget.remaining : Math.max(0, amount - spent);
  const percentage = budget.percentage || (amount > 0 ? Math.round((spent / amount) * 100) : 0);
  const isOverbudget = spent > amount;

  // Status color styles
  let statusBadge = {
    label: "Aman",
    badgeClass: "bg-highlight text-primary border-2 border-primary/30",
    barClass: "bg-primary",
  };

  if (percentage > 100) {
    statusBadge = {
      label: "Melebihi Batas!",
      badgeClass: "bg-red-500/15 text-red-500 border-2 border-red-500/30 font-black",
      barClass: "bg-red-500 animate-pulse",
    };
  } else if (percentage >= 75) {
    statusBadge = {
      label: "Mendekati Batas",
      badgeClass: "bg-amber-500/15 text-amber-600 border-2 border-amber-500/30 font-bold",
      barClass: "bg-amber-500",
    };
  }

  return (
    <Card
      className={`p-5 shadow-[0_3px_0_0_var(--border-color)] flex flex-col justify-between gap-4 transition-all hover:border-primary/50 ${
        isOverbudget ? "border-red-500/60" : "border-border-color"
      }`}
    >
      {/* Top: Category & Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 border-2 border-border-color shadow-xs font-black"
            style={{ backgroundColor: budget.category?.color || "var(--primary)" }}
          >
            <Tag className="h-5 w-5 stroke-[2.5]" />
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-text-primary">
              {budget.category?.name || "Kategori"}
            </span>
            <span className="text-[11px] font-semibold text-text-secondary">
              Batas: {formatRupiah(amount)}
            </span>
          </div>
        </div>

        <span
          className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${statusBadge.badgeClass}`}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* Middle: Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-text-secondary">Terpakai: {formatRupiah(spent)}</span>
          <span className={isOverbudget ? "text-red-500 font-black" : "text-text-primary font-black"}>
            {percentage}%
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-3 rounded-full bg-highlight overflow-hidden border-2 border-border-color p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusBadge.barClass}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>

        {/* Remaining info */}
        <div className="flex justify-between items-center text-[11px] font-semibold mt-0.5">
          {isOverbudget ? (
            <span className="text-red-500 flex items-center gap-1 font-black">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Lebih {formatRupiah(spent - amount)}</span>
            </span>
          ) : (
            <span className="text-text-secondary">Sisa: {formatRupiah(remaining)}</span>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-border-color">
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(budget)}
            className="h-8 w-8 p-0 text-text-secondary hover:text-primary"
            title="Ubah Anggaran"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(budget.id)}
            className="h-8 w-8 p-0 text-text-secondary hover:text-red-500 hover:bg-red-500/10"
            title="Hapus Anggaran"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
