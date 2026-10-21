import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import dayjs from "dayjs";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  PieChart,
  ArrowRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { useFinanceOverview } from "../hooks/use-finance";
import { Button, Card } from "../components/ui";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function DashboardPage() {
  const { data: overview, isLoading } = useFinanceOverview();

  const currentMonthName = dayjs().format("MMMM YYYY");

  if (isLoading || !overview) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const {
    current_balance,
    total_income_this_month,
    total_expense_this_month,
    net_cash_flow_this_month,
    net_worth,
    total_assets,
    total_liabilities,
    budget_progress,
    recent_transactions = [],
  } = overview;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Welcome Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
            Dashboard Keuangan 👋
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-semibold">
            Ringkasan kondisi finansial dan arus kas keluarga untuk {currentMonthName}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link to="/transactions/create">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-1.5"
            >
              <ArrowUpRight className="h-4 w-4 stroke-[3]" />
              <span>+ Pemasukan</span>
            </Button>
          </Link>
          <Link to="/transactions/create">
            <Button
              type="button"
              variant="3d"
              className="btn-3d flex items-center gap-1.5"
            >
              <ArrowDownRight className="h-4 w-4 stroke-[3]" />
              <span>+ Pengeluaran</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Balance Hero Card & Net Worth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Balance */}
        <Card className="lg:col-span-2 p-6 sm:p-8 shadow-[0_4px_0_0_var(--border-color)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/15 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-highlight border-2 border-border-color flex items-center justify-center text-primary shadow-[0_2px_0_0_var(--border-color)]">
                <Wallet className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-text-secondary block">
                  Saldo Kas Tersedia
                </span>
                <span className="text-xs font-bold text-text-primary">
                  Dompet Bersama Pasutri
                </span>
              </div>
            </div>

            <span className="text-xs font-extrabold px-3.5 py-1.5 bg-highlight text-primary rounded-full border-2 border-border-color shadow-xs">
              Aktif & Berjalan
            </span>
          </div>

          <div className="my-6 relative z-10">
            <span className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight block">
              {formatRupiah(current_balance)}
            </span>
            <div className="flex items-center gap-2 mt-2 text-xs font-bold">
              <span className={net_cash_flow_this_month >= 0 ? "text-primary font-black" : "text-red-500 font-black"}>
                {net_cash_flow_this_month >= 0 ? "↑ +" : "↓ -"} {formatRupiah(Math.abs(net_cash_flow_this_month))}
              </span>
              <span className="text-text-secondary">arus kas bersih bulan ini</span>
            </div>
          </div>

          {/* Bottom Bar: Quick summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-border-color relative z-10">
            <div>
              <span className="text-[11px] font-bold text-text-secondary block">Pemasukan Bulan Ini</span>
              <span className="text-base sm:text-lg font-black text-primary">
                +{formatRupiah(total_income_this_month)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-secondary block">Pengeluaran Bulan Ini</span>
              <span className="text-base sm:text-lg font-black text-text-primary">
                -{formatRupiah(total_expense_this_month)}
              </span>
            </div>
          </div>
        </Card>

        {/* Right 1 Col: Net Worth Mini Card */}
        <Card className="p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-accent stroke-[2.5]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                Kekayaan Bersih
              </span>
            </div>
            <Link
              to="/net-worth"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Detail</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-black text-text-primary block">
              {formatRupiah(net_worth)}
            </span>
            <span className="text-[11px] text-text-secondary font-semibold mt-1 block">
              Total aset dikurangi liabilitas
            </span>
          </div>

          <div className="flex flex-col gap-2 pt-3 border-t-2 border-border-color">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-text-secondary font-bold">Total Aset:</span>
              <span className="font-extrabold text-text-primary">{formatRupiah(total_assets)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-text-secondary font-bold">Total Hutang:</span>
              <span className="font-extrabold text-red-500">{formatRupiah(total_liabilities)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Budget Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress Summary (1 Col) */}
        <Card className="p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary stroke-[2.5]" />
              <h2 className="font-extrabold text-base text-text-primary">Status Anggaran</h2>
            </div>
            <Link
              to="/budget"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 my-auto">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[11px] font-bold text-text-secondary uppercase">
                  Pengeluaran Teranggarkan
                </span>
                <span className="text-xl font-black text-text-primary block">
                  {formatRupiah(budget_progress.total_spent)}
                </span>
              </div>
              <span className="text-sm font-extrabold text-text-secondary">
                / {formatRupiah(budget_progress.total_budget)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3.5 rounded-full bg-highlight overflow-hidden border-2 border-border-color">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budget_progress.percentage > 100
                    ? "bg-red-500 animate-pulse"
                    : budget_progress.percentage >= 75
                      ? "bg-amber-500"
                      : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, budget_progress.percentage)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-text-secondary font-bold">
                {budget_progress.percentage}% telah terpakai
              </span>
              <span
                className={`font-black ${
                  budget_progress.percentage > 100 ? "text-red-500" : "text-primary"
                }`}
              >
                {budget_progress.percentage > 100 ? "Melebihi anggaran" : "Sesuai alokasi"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-border-color text-center">
            <Button
              asChild
              variant="outline"
              className="w-full text-xs font-bold"
            >
              <Link to="/budget">
                Kelola Alokasi Anggaran
              </Link>
            </Button>
          </div>
        </Card>

        {/* Recent Transactions (2 Cols) */}
        <Card className="lg:col-span-2 p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary stroke-[2.5]" />
              <h2 className="font-extrabold text-base text-text-primary">Transaksi Terbaru</h2>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent_transactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-text-secondary font-bold">
              Belum ada transaksi yang dicatat bulan ini.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recent_transactions.map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <div
                    key={tx.id}
                    className="p-3 bg-card-surface border-2 border-border-color rounded-xl flex items-center justify-between gap-3 hover:border-primary/50 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 ${
                          isIncome
                            ? "bg-highlight border-primary/30 text-primary"
                            : "bg-highlight border-border-color text-text-secondary"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-sm text-text-primary truncate">
                          {tx.description}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-text-secondary mt-0.5">
                          <span className="font-bold text-primary">
                            {tx.category?.name || "Lainnya"}
                          </span>
                          <span>• {dayjs(tx.date).format("DD MMM YYYY")}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`font-black text-sm shrink-0 ${
                        isIncome ? "text-primary" : "text-text-primary"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
