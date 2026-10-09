import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import dayjs from "dayjs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PieChart,
  Loader2,
  X,
} from "lucide-react";
import {
  useFinanceBudgets,
  useFinanceCategories,
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
} from "../hooks/use-finance.js";
import { BudgetCard } from "../components/BudgetCard.js";
import { FinanceBudget } from "@repo/types";

export const Route = createFileRoute("/budget")({
  component: BudgetPage,
});

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function BudgetPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const monthYearStr = currentDate.format("YYYY-MM");
  const monthLabel = currentDate.format("MMMM YYYY");

  const { data: budgets = [], isLoading } = useFinanceBudgets(monthYearStr);
  const { data: categories = [] } = useFinanceCategories();

  const createBudgetMutation = useCreateBudgetMutation();
  const deleteBudgetMutation = useDeleteBudgetMutation();

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState<number | "">("");

  const expenseCategories = categories.filter((c) => c.type === "expense");

  // Filter out categories that already have budget this month
  const availableCategories = expenseCategories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id)
  );

  const prevMonth = () => setCurrentDate((prev) => prev.subtract(1, "month"));
  const nextMonth = () => setCurrentDate((prev) => prev.add(1, "month"));

  // Calculate totals
  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const handleOpenAdd = () => {
    if (availableCategories.length > 0) {
      setSelectedCatId(availableCategories[0].id);
    }
    setBudgetAmount("");
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !budgetAmount || Number(budgetAmount) <= 0) return;

    await createBudgetMutation.mutateAsync({
      category_id: selectedCatId,
      amount: Number(budgetAmount),
      month_year: monthYearStr,
      period: "monthly",
    });

    setIsModalOpen(false);
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus alokasi anggaran ini?")) {
      await deleteBudgetMutation.mutateAsync(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Title & Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
            Anggaran Belanja
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Pantau dan batasi pengeluaran per kategori agar tidak overbudget
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-card-surface border-2 border-border-color rounded-xl p-1.5 shadow-[0_2px_0_0_var(--border-color)]">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-highlight cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-extrabold text-sm px-2 text-text-primary">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-highlight cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Hero Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <div className="bg-card-surface border-2 border-border-color rounded-2xl p-5 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
            Total Anggaran Bulan Ini
          </span>
          <span className="text-2xl font-black text-primary">
            {formatRupiah(totalBudget)}
          </span>
          <span className="text-xs text-text-secondary font-semibold">
            {budgets.length} kategori dialokasikan
          </span>
        </div>

        {/* Total Spent Card */}
        <div className="bg-card-surface border-2 border-border-color rounded-2xl p-5 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
            Total Pengeluaran Aktual
          </span>
          <span className="text-2xl font-black text-text-primary">
            {formatRupiah(totalSpent)}
          </span>
          <span className="text-xs text-text-secondary font-semibold">
            {overallPercentage}% dari total anggaran
          </span>
        </div>

        {/* Remaining Budget Card */}
        <div className="bg-card-surface border-2 border-border-color rounded-2xl p-5 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
            Sisa Kuota Anggaran
          </span>
          <span
            className={`text-2xl font-black ${
              totalBudget - totalSpent < 0 ? "text-red-500" : "text-primary"
            }`}
          >
            {formatRupiah(Math.max(0, totalBudget - totalSpent))}
          </span>
          <span className="text-xs text-text-secondary font-semibold">
            {totalBudget - totalSpent < 0 ? "⚠️ Melebihi batas total" : "Kondisi arus kas terkendali"}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-text-primary">Alokasi per Kategori</h2>
        <button
          onClick={handleOpenAdd}
          className="btn-3d px-4 py-2 rounded-xl font-extrabold text-xs shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_75%,#000)] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ Tambah Anggaran</span>
        </button>
      </div>

      {/* Budgets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-card-surface border-2 border-dashed border-border-color rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-highlight border-2 border-border-color flex items-center justify-center text-primary shadow-[0_2px_0_0_var(--border-color)]">
            <PieChart className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h3 className="font-extrabold text-lg text-text-primary">Belum Ada Anggaran</h3>
          <p className="text-xs text-text-secondary font-semibold max-w-sm">
            Tentukan batas belanja untuk kategori pengeluaran Anda (seperti Makanan, Transportasi, Tagihan) agar pengeluaran tetap terkontrol.
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-3d mt-2 px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
          >
            + Buat Anggaran Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onDelete={handleDeleteBudget} />
          ))}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card-surface border-2 border-border-color rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border-color bg-highlight/40">
              <h3 className="text-base font-extrabold text-text-primary">
                Atur Anggaran — {monthLabel}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Kategori Pengeluaran
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-card-surface border-2 border-border-color rounded-xl font-bold text-sm text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                >
                  {availableCategories.length === 0 ? (
                    <option value="" disabled>
                      Semua kategori pengeluaran telah dialokasikan
                    </option>
                  ) : (
                    availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Batas Anggaran (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-text-secondary">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="Contoh: 1500000"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-2.5 bg-card-surface border-2 border-border-color rounded-xl font-black text-base text-text-primary focus:outline-hidden focus:border-primary"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm border-2 border-border-color hover:bg-highlight text-text-secondary cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createBudgetMutation.isPending || !selectedCatId || !budgetAmount}
                  className="btn-3d flex-1 py-2.5 px-4 rounded-xl font-extrabold text-sm shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_75%,#000)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createBudgetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Simpan Anggaran</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
