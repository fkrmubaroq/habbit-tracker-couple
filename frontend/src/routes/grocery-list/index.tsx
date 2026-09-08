import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  CheckSquare,
  Square,
  Plus,
  Flame,
  CheckCircle2,
  Circle,
  Receipt,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { groceryService } from "../../services/grocery.service";
import type { GroceryItem } from "../../types/index";
import { useToastStore } from "../../stores/toast.store";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/grocery-list/")({
  component: GroceryChecklistPage,
});

const CATEGORIES = [
  { id: "all", name: "Semua", emoji: "✨" },
  { id: "Sayur & Buah", name: "Sayur & Buah", emoji: "🥦" },
  { id: "Daging & Ikan", name: "Daging & Ikan", emoji: "🥩" },
  { id: "Susu & Telur", name: "Susu & Telur", emoji: "🥛" },
  { id: "Bumbu & Dapur", name: "Bumbu & Dapur", emoji: "🧂" },
  { id: "Snack & Minuman", name: "Snack & Minuman", emoji: "🍪" },
  { id: "Kebutuhan Rumah", name: "Kebutuhan Rumah", emoji: "🧼" },
  { id: "Lainnya", name: "Lainnya", emoji: "📦" },
];

function GroceryChecklistPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [filterTab, setFilterTab] = React.useState<"pending" | "completed" | "all">("pending");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [quickItemName, setQuickItemName] = React.useState("");

  // Query grocery items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["grocery-items"],
    queryFn: () => groceryService.getItems(),
  });

  // Quick Add Mutation
  const quickAddMutation = useMutation({
    mutationFn: (name: string) =>
      groceryService.createItem({
        name,
        category: "Lainnya",
        quantity: "1",
        unit: "pcs",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      setQuickItemName("");
      addToast("Barang ditambahkan ke daftar!", "success");
    },
  });

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_completed }: { id: string; is_completed: boolean }) =>
      groceryService.toggleComplete(id, is_completed),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      if (updatedItem?.is_completed) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    },
  });

  // Calculations
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.is_completed).length;
  const pendingItems = totalItems - completedItems;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const totalEstimatedPrice = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterTab === "pending" && item.is_completed) return false;
    if (filterTab === "completed" && !item.is_completed) return false;
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    return true;
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemName.trim()) return;
    quickAddMutation.mutate(quickItemName.trim());
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-13 w-13 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  Daftar Belanja
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Checklist
                </span>
              </div>
              <p className="text-xs font-bold text-text-secondary mt-0.5">
                Centang belanjaan yang sudah dimasukkan ke keranjang belanja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="3d-secondary"
              size="sm"
              onClick={() => navigate({ to: "/grocery-list/manage" })}
              className="font-black text-xs flex items-center gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Kelola Barang</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div className="mt-4 pt-4 border-t-2 border-border-color/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
              <span>
                {completedItems} dari {totalItems} barang terbeli
              </span>
              <span className="font-extrabold text-emerald-700">{progressPercent}% Selesai</span>
            </div>
            <div className="w-full h-3.5 bg-highlight border-2 border-border-color rounded-full overflow-hidden p-[2px]">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 bg-card-surface border-3 border-border-color p-2 sm:p-2.5 rounded-2xl shadow-[0_3px_0_0_var(--border-color)]"
      >
        <input
          type="text"
          value={quickItemName}
          onChange={(e) => setQuickItemName(e.target.value)}
          placeholder="Tambah cepat... (misal: Telur 1kg, Sabun cuci)"
          className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-bold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary/60"
        />
        <Button
          type="submit"
          variant="3d"
          size="sm"
          disabled={quickAddMutation.isPending || !quickItemName.trim()}
          className="h-10 px-4 font-black flex items-center gap-1 shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span className="hidden sm:inline">Tambah</span>
        </Button>
      </form>

      {/* Filter Tabs & Category Filter */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-1 bg-card-surface border-2 border-border-color p-1 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setFilterTab("pending")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                filterTab === "pending"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Perlu Dibeli ({pendingItems})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("completed")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                filterTab === "completed"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Sudah Dibeli ({completedItems})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                filterTab === "all"
                  ? "bg-text-primary text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Semua ({totalItems})
            </button>
          </div>

          {/* Quick link to Manage page */}
          <Link
            to="/grocery-list/manage"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shrink-0"
          >
            + Kelola Lengkap
          </Link>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 cursor-pointer",
                  isSelected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-black shadow-xs"
                    : "border-border-color bg-card-surface text-text-secondary hover:text-text-primary"
                )}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card-surface border-2 border-border-color rounded-3xl text-center">
            <CheckSquare className="h-8 w-8 text-emerald-500 animate-bounce" />
            <span className="text-xs font-bold text-text-secondary mt-2">Memuat daftar belanjaan...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-card-surface border-3 border-dashed border-border-color rounded-3xl text-center">
            {filterTab === "pending" && completedItems > 0 ? (
              <>
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mb-2 animate-bounce">
                  🎉
                </div>
                <h3 className="text-base font-black text-text-primary">Semua Belanjaan Beres!</h3>
                <p className="text-xs font-bold text-text-secondary max-w-sm mt-1">
                  Keren! Semua belanjaan yang direncanakan sudah terbeli dengan lengkap.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="3d-secondary"
                    size="sm"
                    onClick={() => setFilterTab("completed")}
                    className="font-black"
                  >
                    Lihat Barang Terbeli
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-highlight flex items-center justify-center text-3xl mb-2">
                  🛒
                </div>
                <h3 className="text-base font-black text-text-primary">Daftar belanja masih kosong</h3>
                <p className="text-xs font-bold text-text-secondary max-w-xs mt-1">
                  Tulis kebutuhan dapurmu di atas atau kelola rincian lengkap di menu Belanja.
                </p>
                <Button
                  variant="3d"
                  size="sm"
                  onClick={() => navigate({ to: "/grocery-list/manage" })}
                  className="mt-4 font-black"
                >
                  Buka Kelola Belanja
                </Button>
              </>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleted = item.is_completed;
            const itemCat = CATEGORIES.find((c) => c.name === item.category);

            return (
              <div
                key={item.id}
                onClick={() => toggleMutation.mutate({ id: item.id, is_completed: !isCompleted })}
                className={cn(
                  "group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer select-none",
                  isCompleted
                    ? "bg-highlight/40 border-border-color/70 opacity-60 hover:opacity-80"
                    : "bg-card-surface border-border-color hover:border-emerald-400 shadow-[0_2px_0_0_var(--border-color)] hover:shadow-md"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Checkbox Icon */}
                  <div
                    className={cn(
                      "h-7 w-7 rounded-xl flex items-center justify-center border-2 transition-all shrink-0",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-xs"
                        : "bg-card-surface border-border-color group-hover:border-emerald-500 group-hover:scale-105"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4.5 w-4.5 stroke-[2.5]" />
                    ) : (
                      <Circle className="h-3 w-3 text-transparent" />
                    )}
                  </div>

                  {/* Item Content */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "font-black text-sm sm:text-base text-text-primary transition-all",
                          isCompleted ? "line-through text-text-secondary" : ""
                        )}
                      >
                        {item.name}
                      </span>

                      {item.is_urgent && !isCompleted && (
                        <span className="flex items-center gap-0.5 bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.2 rounded-full border border-rose-200">
                          <Flame className="h-3 w-3 fill-rose-500" />
                          Mendesak
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-xs font-bold text-text-secondary mt-0.5 flex-wrap">
                      <span className="bg-highlight px-2 py-0.5 rounded-lg border border-border-color/60 text-[11px]">
                        {itemCat?.emoji || "📦"} {item.category}
                      </span>

                      <span className="text-[11px] font-extrabold text-text-primary">
                        {item.quantity} {item.unit || ""}
                      </span>

                      {item.estimated_price && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                          {formatRupiah(item.estimated_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "text-xs font-extrabold px-2.5 py-1 rounded-xl transition-all",
                      isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-highlight text-text-secondary group-hover:bg-emerald-50 group-hover:text-emerald-700"
                    )}
                  >
                    {isCompleted ? "Sudah" : "Beli"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
