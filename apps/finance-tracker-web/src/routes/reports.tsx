import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  BarChart3,
  Loader2,
  PieChart as PieIcon,
  Activity,
} from "lucide-react";
import { useFinanceReports } from "../hooks/use-finance.js";
import {
  IncomeExpenseBarChart,
  CategoryDonutChart,
  CashFlowAreaChart,
} from "../components/FinanceCharts.js";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ReportsPage() {
  const [activePreset, setActivePreset] = useState<string>("this_month");

  const { startDate, endDate } = useMemo(() => {
    const now = dayjs();
    switch (activePreset) {
      case "this_month":
        return { startDate: now.startOf("month").format("YYYY-MM-DD"), endDate: now.endOf("month").format("YYYY-MM-DD") };
      case "last_month":
        const lastM = now.subtract(1, "month");
        return { startDate: lastM.startOf("month").format("YYYY-MM-DD"), endDate: lastM.endOf("month").format("YYYY-MM-DD") };
      case "3_months":
        return { startDate: now.subtract(2, "month").startOf("month").format("YYYY-MM-DD"), endDate: now.endOf("month").format("YYYY-MM-DD") };
      case "this_year":
        return { startDate: now.startOf("year").format("YYYY-MM-DD"), endDate: now.endOf("year").format("YYYY-MM-DD") };
      default:
        return { startDate: now.startOf("month").format("YYYY-MM-DD"), endDate: now.endOf("month").format("YYYY-MM-DD") };
    }
  }, [activePreset]);

  const { data: report, isLoading } = useFinanceReports(startDate, endDate);

  const presets = [
    { id: "this_month", label: "Bulan Ini" },
    { id: "last_month", label: "Bulan Lalu" },
    { id: "3_months", label: "3 Bulan Terakhir" },
    { id: "this_year", label: "Tahun Ini" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Title & Preset Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Analisis arus kas, distribusi pengeluaran, dan tren finansial
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-card-surface border-2 border-border-color rounded-xl p-1.5 shadow-[0_2px_0_0_var(--border-color)]">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activePreset === p.id
                  ? "bg-highlight text-primary border-2 border-primary shadow-[0_2px_0_0_var(--border-color)]"
                  : "bg-highlight/50 border-2 border-border-color text-text-secondary hover:text-text-primary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : !report ? (
        <div className="text-center p-12 text-sm text-text-secondary font-bold">
          Tidak ada data laporan ditemukan.
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income */}
            <div className="bg-card-surface border-2 border-border-color rounded-2xl p-5 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
                  Total Pemasukan
                </span>
                <div className="w-8 h-8 rounded-xl bg-highlight border-2 border-border-color text-primary flex items-center justify-center shadow-xs">
                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                </div>
              </div>
              <span className="text-2xl font-black text-primary">
                {formatRupiah(report.total_income)}
              </span>
              <span className="text-[11px] text-text-secondary font-semibold">
                Periode {dayjs(startDate).format("DD MMM")} – {dayjs(endDate).format("DD MMM YYYY")}
              </span>
            </div>

            {/* Total Expense */}
            <div className="bg-card-surface border-2 border-border-color rounded-2xl p-5 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
                  Total Pengeluaran
                </span>
                <div className="w-8 h-8 rounded-xl bg-highlight border-2 border-border-color text-text-secondary flex items-center justify-center shadow-xs">
                  <ArrowDownRight className="h-4 w-4 stroke-[2.5]" />
                </div>
              </div>
              <span className="text-2xl font-black text-text-primary">
                {formatRupiah(report.total_expense)}
              </span>
              <span className="text-[11px] text-text-secondary font-semibold">
                Rata-rata: {formatRupiah(report.average_daily_expense)}/hari
              </span>
            </div>

            {/* Net Cash Flow */}
            <div className="bg-card-surface border-2 border-border-color rounded-2xl p-5 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
                  Net Cash Flow
                </span>
                <div className="w-8 h-8 rounded-xl bg-highlight border-2 border-border-color text-primary flex items-center justify-center shadow-xs">
                  <TrendingUp className="h-4 w-4 stroke-[2.5]" />
                </div>
              </div>
              <span
                className={`text-2xl font-black ${
                  report.net_cash_flow >= 0 ? "text-primary" : "text-red-500"
                }`}
              >
                {formatRupiah(report.net_cash_flow)}
              </span>
              <span className="text-[11px] text-text-secondary font-semibold">
                {report.net_cash_flow >= 0 ? "Surplus kas positif" : "Defisit arus kas"}
              </span>
            </div>

            {/* Savings Ratio */}
            <div className="bg-card-surface border-2 border-border-color rounded-2xl p-5 shadow-[0_4px_0_0_var(--border-color)] flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
                  Rasio Tabungan
                </span>
                <div className="w-8 h-8 rounded-xl bg-highlight border-2 border-border-color text-accent flex items-center justify-center shadow-xs">
                  <Activity className="h-4 w-4 stroke-[2.5]" />
                </div>
              </div>
              <span className="text-2xl font-black text-accent">
                {report.total_income > 0
                  ? `${Math.max(0, Math.round((report.net_cash_flow / report.total_income) * 100))}%`
                  : "0%"}
              </span>
              <span className="text-[11px] text-text-secondary font-semibold">
                Proporsi pemasukan tersimpan
              </span>
            </div>
          </div>

          {/* Charts Row 1: Income vs Expense & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Bar Comparison */}
            <div className="bg-card-surface border-2 border-border-color rounded-2xl p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-5 w-5 text-primary stroke-[2.5]" />
                <h2 className="font-extrabold text-base text-text-primary">
                  Perbandingan Pemasukan & Pengeluaran
                </h2>
              </div>
              <IncomeExpenseBarChart
                totalIncome={report.total_income}
                totalExpense={report.total_expense}
              />
            </div>

            {/* Chart 2: Donut Category Distribution */}
            <div className="bg-card-surface border-2 border-border-color rounded-2xl p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <PieIcon className="h-5 w-5 text-accent stroke-[2.5]" />
                <h2 className="font-extrabold text-base text-text-primary">
                  Distribusi Pengeluaran per Kategori
                </h2>
              </div>
              <CategoryDonutChart categories={report.expense_by_category} />
            </div>
          </div>

          {/* Charts Row 2: Cash Flow Trend */}
          <div className="bg-card-surface border-2 border-border-color rounded-2xl p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="h-5 w-5 text-primary stroke-[2.5]" />
              <h2 className="font-extrabold text-base text-text-primary">
                Tren Arus Kas Harian (Income vs Expense)
              </h2>
            </div>
            <CashFlowAreaChart trend={report.cash_flow_trend} />
          </div>
        </>
      )}
    </div>
  );
}
