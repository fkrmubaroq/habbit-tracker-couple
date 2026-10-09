import { FinanceTransaction } from "@repo/types";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Coins,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  Select,
} from "../components/ui";
import {
  useDeleteTransactionMutation,
  useFinanceCategories,
  useFinanceTransactions,
} from "../hooks/use-finance";

export const Route = createFileRoute("/transactions")({
  component: TransactionsPage,
});

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function TransactionsPage() {
  const deleteTxMutation = useDeleteTransactionMutation();

  // Filters state
  const [activePreset, setActivePreset] = useState<string>("this_month");
  const [selectedType, setSelectedType] = useState<"income" | "expense" | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Compute dates based on preset
  const { startDate, endDate } = useMemo(() => {
    const now = dayjs();
    switch (activePreset) {
      case "today":
        return { startDate: now.format("YYYY-MM-DD"), endDate: now.format("YYYY-MM-DD") };
      case "7_days":
        return { startDate: now.subtract(6, "day").format("YYYY-MM-DD"), endDate: now.format("YYYY-MM-DD") };
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
        return { startDate: undefined, endDate: undefined };
    }
  }, [activePreset]);

  const { data, isLoading } = useFinanceTransactions({
    type: selectedType,
    category_id: selectedCategory || undefined,
    startDate,
    endDate,
    search: searchKeyword || undefined,
    limit: 100,
  });

  const { data: categories = [] } = useFinanceCategories();

  const transactions = data?.transactions || [];

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: FinanceTransaction[] } = {};
    for (const tx of transactions) {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    }
    return groups;
  }, [transactions]);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const handleDelete = async (id: string, description: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus transaksi "${description}"?`)) {
      await deleteTxMutation.mutateAsync(id);
    }
  };

  const presets = [
    { id: "today", label: "Hari Ini" },
    { id: "7_days", label: "7 Hari Terakhir" },
    { id: "this_month", label: "Bulan Ini" },
    { id: "last_month", label: "Bulan Lalu" },
    { id: "3_months", label: "3 Bulan Terakhir" },
    { id: "this_year", label: "Tahun Ini" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-semibold">
            Kelola seluruh catatan mutasi keuangan keluarga Anda
          </p>
        </div>

        <Link to="/transactions/create">
          <Button
            type="button"
            variant="3d"
            className="self-start sm:self-auto flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ Transaksi Baru</span>
          </Button>
        </Link>
      </div>

      {/* Filter Presets Toolbar */}
      <Card className="flex flex-col gap-3.5 p-4 sm:p-5 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-black text-text-secondary uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Calendar className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
            <span>Periode:</span>
          </span>
          {presets.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant={activePreset === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActivePreset(p.id)}
              className="text-xs shrink-0"
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Search & Type & Category Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t-2 border-border-color">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary stroke-[2.5] z-10 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari transaksi..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-1.5 p-1 bg-highlight rounded-xl border-2 border-border-color">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedType(undefined)}
              className={`flex-1 text-xs font-extrabold ${selectedType === undefined
                  ? "bg-card-surface text-text-primary border-2 border-border-color shadow-xs"
                  : "text-text-secondary hover:text-text-primary border-2 border-transparent"
                }`}
            >
              Semua
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedType("expense")}
              className={`flex-1 text-xs font-extrabold ${selectedType === "expense"
                  ? "bg-card-surface text-text-primary border-2 border-border-color shadow-xs"
                  : "text-text-secondary hover:text-text-primary border-2 border-transparent"
                }`}
            >
              Pengeluaran
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedType("income")}
              className={`flex-1 text-xs font-extrabold ${selectedType === "income"
                  ? "bg-card-surface text-primary border-2 border-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary border-2 border-transparent"
                }`}
            >
              Pemasukan
            </Button>
          </div>

          {/* Category Dropdown */}
          <div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === "income" ? "Pemasukan" : "Pengeluaran"})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Transaction List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm font-bold text-text-secondary">Memuat transaksi...</span>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-card-surface border-2 border-dashed border-border-color rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-highlight border-2 border-border-color flex items-center justify-center text-primary shadow-[0_2px_0_0_var(--border-color)]">
            <Coins className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h3 className="font-extrabold text-lg text-text-primary">Belum Ada Transaksi</h3>
          <p className="text-xs text-text-secondary font-semibold max-w-sm">
            Tidak ada transaksi ditemukan pada periode atau filter yang dipilih. Silakan catat transaksi baru atau ubah filter.
          </p>
          <Link to="/transactions/create">
            <Button
              type="button"
              variant="3d"
              className="mt-2 text-xs"
            >
              + Catat Transaksi
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedDates.map((dateStr) => {
            const dateTxList = groupedTransactions[dateStr];
            const dateFormatted = dayjs(dateStr).format("DD MMMM YYYY");

            return (
              <div key={dateStr} className="flex flex-col gap-2.5">
                {/* Date Header */}
                <div className="flex items-center gap-2 px-1">
                  <span className="font-black text-xs uppercase tracking-wider text-text-secondary">
                    {dateFormatted}
                  </span>
                  <div className="flex-1 h-0.5 bg-border-color/60"></div>
                </div>

                {/* Date Transaction Cards */}
                <div className="flex flex-col gap-2.5">
                  {dateTxList.map((tx) => {
                    const isIncome = tx.type === "income";

                    return (
                      <div
                        key={tx.id}
                        className="bg-card-surface border-2 border-border-color rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[0_2px_0_0_var(--border-color)] hover:border-primary/50 transition-all"
                      >
                        {/* Left: Icon & Description */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${isIncome
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
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-highlight border border-border-color text-text-secondary">
                                {tx.category?.name || "Lainnya"}
                              </span>
                              {tx.notes && (
                                <span className="text-[11px] text-text-secondary font-medium truncate max-w-[150px]">
                                  • {tx.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Delete Button */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-black text-sm md:text-base ${isIncome ? "text-primary" : "text-text-primary"
                              }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatRupiah(tx.amount)}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tx.id, tx.description)}
                            className="h-8 w-8 p-0 text-text-secondary hover:text-red-500 hover:bg-red-500/10"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
