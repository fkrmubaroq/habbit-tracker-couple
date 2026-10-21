import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import dayjs from "dayjs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PieChart,
  Loader2,
} from "lucide-react";
import {
  useFinanceBudgets,
  useFinanceCategories,
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
} from "../hooks/use-finance";
import { BudgetCard } from "../components/BudgetCard";
import { FinanceBudget } from "@repo/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Select,
  Card,
} from "../components/ui";

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
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format("YYYY-MM"));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState<number | "">("");

  const monthLabel = dayjs(`${selectedMonth}-01`).format("MMMM YYYY");

  const { data: budgets = [], isLoading } = useFinanceBudgets(selectedMonth);
  const { data: categories = [] } = useFinanceCategories();
  const createBudgetMutation = useCreateBudgetMutation();
  const deleteBudgetMutation = useDeleteBudgetMutation();

  const expenseCategories = categories.filter((c) => c.type === "expense");

  // Filter out categories already allocated for this month
  const availableCategories = expenseCategories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id)
  );

  const prevMonth = () => {
    setSelectedMonth(dayjs(`${selectedMonth}-01`).subtract(1, "month").format("YYYY-MM"));
  };

  const nextMonth = () => {
    setSelectedMonth(dayjs(`${selectedMonth}-01`).add(1, "month").format("YYYY-MM"));
  };

  // Stats
  const totalBudget = budgets.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent || 0), 0);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const handleOpenAdd = () => {
    if (availableCategories.length > 0) {
      setSelectedCatId(availableCategories[0].id);
    } else {
      setSelectedCatId("");
    }
    setBudgetAmount("");
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !budgetAmount || Number(budgetAmount) <= 0) return;

    await createBudgetMutation.mutateAsync({
      category_id: selectedCatId,
      month: selectedMonth,
      amount: Number(budgetAmount),
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-extrabold text-sm px-2 text-text-primary">{monthLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Hero Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <Card className="p-5 flex flex-col justify-between gap-2 shadow-[0_4px_0_0_var(--border-color)]">
          <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
            Total Anggaran Bulan Ini
          </span>
          <span className="text-2xl font-black text-primary">
            {formatRupiah(totalBudget)}
          </span>
          <span className="text-xs text-text-secondary font-semibold">
            {budgets.length} kategori dialokasikan
          </span>
        </Card>

        {/* Total Spent Card */}
        <Card className="p-5 flex flex-col justify-between gap-2 shadow-[0_4px_0_0_var(--border-color)]">
          <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
            Total Pengeluaran Aktual
          </span>
          <span className="text-2xl font-black text-text-primary">
            {formatRupiah(totalSpent)}
          </span>
          <span className="text-xs text-text-secondary font-semibold">
            {overallPercentage}% dari total anggaran
          </span>
        </Card>

        {/* Remaining Budget Card */}
        <Card className="p-5 flex flex-col justify-between gap-2 shadow-[0_4px_0_0_var(--border-color)]">
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
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-text-primary">Alokasi per Kategori</h2>
        <Button
          type="button"
          variant="3d"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ Tambah Anggaran</span>
        </Button>
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
          <Button
            type="button"
            variant="3d"
            onClick={handleOpenAdd}
            className="mt-2 text-xs"
          >
            + Buat Anggaran Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onDelete={handleDeleteBudget} />
          ))}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-text-primary">
              Atur Anggaran — {monthLabel}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Tentukan batas kuota belanja per kategori untuk bulan ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBudget} className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Kategori Pengeluaran
              </label>
              <Select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
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
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Batas Anggaran (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-text-secondary z-10 pointer-events-none">
                  Rp
                </span>
                <Input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="Contoh: 1500000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="pl-12 pr-4 font-black text-base"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="3d"
                disabled={createBudgetMutation.isPending || !selectedCatId || !budgetAmount}
                className="flex-1"
              >
                {createBudgetMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Simpan Anggaran</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
