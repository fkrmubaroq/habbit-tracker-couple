import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Flame,
  Receipt,
  RotateCcw,
  Layers,
  Sparkles,
  ArrowLeft,
  DollarSign,
  PieChart,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { groceryService } from "../../services/grocery.service";
import type { GroceryItem } from "../../types/index";
import { useAuthStore } from "../../stores/auth.store";
import { useToastStore } from "../../stores/toast.store";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/grocery-list/manage")({
  component: GroceryManagePage,
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

const COMMON_UNITS = ["pcs", "kg", "gram", "ikat", "bungkus", "botol", "kotak", "liter"];

function GroceryManagePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  // Form State
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Sayur & Buah");
  const [quantity, setQuantity] = React.useState("1");
  const [unit, setUnit] = React.useState("pcs");
  const [estimatedPrice, setEstimatedPrice] = React.useState<string>("");
  const [isUrgent, setIsUrgent] = React.useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = React.useState<GroceryItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("Lainnya");
  const [editQuantity, setEditQuantity] = React.useState("1");
  const [editUnit, setEditUnit] = React.useState("pcs");
  const [editPrice, setEditPrice] = React.useState("");
  const [editUrgent, setEditUrgent] = React.useState(false);

  // Query grocery items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["grocery-items"],
    queryFn: () => groceryService.getItems(),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: groceryService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      setName("");
      setQuantity("1");
      setEstimatedPrice("");
      setIsUrgent(false);
      addToast("Barang belanjaan berhasil ditambahkan!", "success");
    },
    onError: () => {
      addToast("Gagal menambahkan barang belanjaan", "error");
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GroceryItem> }) =>
      groceryService.updateItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      setEditingItem(null);
      addToast("Barang belanjaan berhasil diperbarui!", "success");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: groceryService.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      addToast("Barang belanjaan dihapus", "success");
    },
  });

  // Clear Completed Mutation
  const clearCompletedMutation = useMutation({
    mutationFn: groceryService.clearCompleted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      addToast("Belanjaan yang sudah selesai berhasil dibersihkan", "success");
    },
  });

  // Reset Completed Mutation
  const resetAllMutation = useMutation({
    mutationFn: async () => {
      const completedList = items.filter((i) => i.is_completed);
      for (const it of completedList) {
        await groceryService.toggleComplete(it.id, false);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      addToast("Semua centang belanjaan berhasil direset", "success");
    },
  });

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    return true;
  });

  const totalEstimatedPrice = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({
      name: name.trim(),
      category,
      quantity: quantity.trim() || "1",
      unit: unit || null,
      estimated_price: estimatedPrice ? Number(estimatedPrice) : null,
      is_urgent: isUrgent,
    });
  };

  const handleOpenEdit = (item: GroceryItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category || "Lainnya");
    setEditQuantity(item.quantity || "1");
    setEditUnit(item.unit || "pcs");
    setEditPrice(item.estimated_price ? item.estimated_price.toString() : "");
    setEditUrgent(Boolean(item.is_urgent));
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editName.trim()) return;
    updateMutation.mutate({
      id: editingItem.id,
      payload: {
        name: editName.trim(),
        category: editCategory,
        quantity: editQuantity.trim() || "1",
        unit: editUnit || null,
        estimated_price: editPrice ? Number(editPrice) : null,
        is_urgent: editUrgent,
      },
    });
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
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  Kelola Belanjaan
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  CRUD
                </span>
              </div>
              <p className="text-xs font-bold text-text-secondary mt-0.5">
                Tambah, edit, dan atur daftar belanjaan pasutri secara lengkap
              </p>
            </div>
          </div>

          {totalEstimatedPrice > 0 && (
            <div className="flex items-center gap-2 bg-highlight border-2 border-border-color px-3.5 py-2 rounded-2xl self-start sm:self-auto shadow-xs">
              <Receipt className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
                  Total Estimasi
                </span>
                <span className="text-xs sm:text-sm font-black text-text-primary">
                  {formatRupiah(totalEstimatedPrice)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Tambah Item Lengkap */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-4 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <h2 className="text-base font-black text-text-primary mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary stroke-[3]" />
          <span>Tambah Barang Baru</span>
        </h2>

        <form onSubmit={handleAddItem} className="flex flex-col gap-3.5">
          {/* Item Name */}
          <div>
            <label className="text-xs font-extrabold text-text-secondary block mb-1">
              Nama Barang
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Daging Sapi 500g, Minyak Goreng 2L"
              className="w-full h-11 px-4 text-sm font-bold bg-highlight border-2 border-border-color rounded-2xl focus:outline-none focus:border-primary text-text-primary"
            />
          </div>

          {/* Grid: Quantity, Unit, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-extrabold text-text-secondary block mb-1">
                Jumlah
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full h-11 px-3 text-center text-sm font-extrabold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-text-secondary block mb-1">
                Satuan
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-3 text-xs font-extrabold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary cursor-pointer"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-text-secondary block mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 text-xs font-extrabold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary cursor-pointer"
              >
                {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimasi Harga & Urgent Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
            <div>
              <label className="text-xs font-extrabold text-text-secondary block mb-1">
                Estimasi Harga (Opsional)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-extrabold text-text-secondary">
                  Rp
                </span>
                <input
                  type="number"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  placeholder="Contoh: 45000"
                  className="w-full h-11 pl-10 pr-4 text-sm font-bold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary"
                />
              </div>
            </div>

            <div className="pt-5 sm:pt-4">
              <button
                type="button"
                onClick={() => setIsUrgent(!isUrgent)}
                className={cn(
                  "w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl border-2 text-xs font-extrabold transition-all cursor-pointer",
                  isUrgent
                    ? "bg-rose-100 border-rose-300 text-rose-700 shadow-xs"
                    : "bg-highlight border-border-color text-text-secondary hover:text-text-primary"
                )}
              >
                <Flame className={cn("h-4 w-4", isUrgent ? "text-rose-600 fill-rose-500" : "")} />
                <span>{isUrgent ? "Barang Mendesak 🔥" : "Tandai sebagai Mendesak"}</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="3d"
            disabled={createMutation.isPending || !name.trim()}
            className="w-full h-11 mt-2 font-black flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5 stroke-3" />
            <span>Tambahkan ke Daftar Belanjaan</span>
          </Button>
        </form>
      </div>

      {/* Filter & Bulk Actions Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs font-black text-text-primary">
            Daftar Barang ({filteredItems.length} barang)
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {items.some((i) => i.is_completed) && (
              <button
                type="button"
                onClick={() => resetAllMutation.mutate()}
                className="text-[11px] font-extrabold text-text-secondary hover:text-text-primary bg-highlight px-2.5 py-1.5 rounded-xl border border-border-color transition-all cursor-pointer flex items-center gap-1"
                title="Reset centang semua barang"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Centang</span>
              </button>
            )}

            {items.some((i) => i.is_completed) && (
              <button
                type="button"
                onClick={() => clearCompletedMutation.mutate()}
                className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                title="Hapus barang yang selesai"
              >
                <Trash2 className="h-3 w-3" />
                <span>Bersihkan Selesai</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 cursor-pointer",
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

      {/* Items List (Manage Mode) */}
      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="p-8 text-center bg-card-surface border-2 border-border-color rounded-2xl">
            <span className="text-xs font-bold text-text-secondary">Memuat barang...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-card-surface border-2 border-dashed border-border-color rounded-2xl">
            <span className="text-xs font-bold text-text-secondary">
              Tidak ada barang di kategori ini.
            </span>
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemCat = CATEGORIES.find((c) => c.name === item.category);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 border-border-color bg-card-surface hover:border-primary/40 transition-all shadow-[0_2px_0_0_var(--border-color)]"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-text-primary truncate">
                      {item.name}
                    </span>
                    {item.is_urgent && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-md border border-rose-200">
                        🔥 Mendesak
                      </span>
                    )}
                    {item.is_completed && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.2 rounded-md border border-emerald-200">
                        ✓ Selesai
                      </span>
                    )}
                  </div>

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

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-highlight transition-colors cursor-pointer"
                    title="Edit barang"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-text-secondary hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus barang"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-md rounded-3xl border-3 border-border-color">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-text-primary">
                Edit Barang Belanjaan
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-3">
              <div>
                <label className="text-xs font-extrabold text-text-secondary block mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm font-bold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-extrabold text-text-secondary block mb-1">
                    Jumlah
                  </label>
                  <input
                    type="text"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm font-bold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-text-secondary block mb-1">
                    Satuan
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-extrabold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary cursor-pointer"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-text-secondary block mb-1">
                  Kategori
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full h-11 px-3 text-xs font-extrabold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary cursor-pointer"
                >
                  {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-text-secondary block mb-1">
                  Estimasi Harga (Rp)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Contoh: 35000"
                  className="w-full h-11 px-3.5 text-sm font-bold bg-highlight border-2 border-border-color rounded-xl focus:outline-none focus:border-primary text-text-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-urgent-manage"
                  checked={editUrgent}
                  onChange={(e) => setEditUrgent(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
                <label htmlFor="edit-urgent-manage" className="text-xs font-bold text-text-primary cursor-pointer">
                  Tandai sebagai mendesak / harus segera dibeli 🔥
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
                className="font-bold"
              >
                Batal
              </Button>
              <Button
                variant="3d"
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
                className="font-black"
              >
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
