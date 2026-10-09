import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Wallet,
  Tag,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  useFinanceSettings,
  useUpdateSettingsMutation,
  useFinanceCategories,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from "../hooks/use-finance";
import { DeleteCategoryDialog } from "../components/DeleteCategoryDialog";
import { ThemeSwitcherSection } from "../components/ThemeSwitcher";
import { FinanceCategory } from "@repo/types";
import {
  Button,
  Input,
  Card,
} from "../components/ui";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings, isLoading: isLoadingSettings } = useFinanceSettings();
  const updateSettingsMutation = useUpdateSettingsMutation();

  const { data: categories = [], isLoading: isLoadingCategories } = useFinanceCategories();
  const createCategoryMutation = useCreateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();

  // Settings initial balance state
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setInitialBalance(settings.initial_balance);
    }
  }, [settings]);

  // Category tab state
  const [activeCategoryTab, setActiveCategoryTab] = useState<"expense" | "income">("expense");

  // Add category state
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#FF8FB1");

  // Delete category dialog state
  const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettingsMutation.mutateAsync(initialBalance);
    setIsSettingsSaved(true);
    setTimeout(() => setIsSettingsSaved(false), 3000);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await createCategoryMutation.mutateAsync({
      name: newCatName.trim(),
      type: activeCategoryTab,
      icon: "Tag",
      color: newCatColor,
    });

    setNewCatName("");
    setIsAddingCat(false);
  };

  const filteredCategories = categories.filter((c) => c.type === activeCategoryTab);

  const handleDeleteCategoryClick = (category: FinanceCategory) => {
    if (category.transaction_count && category.transaction_count > 0) {
      // Must open reassign dialog
      setCategoryToDelete(category);
    } else {
      // Can directly delete
      if (confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
        // Find default or first available replacement
        const replacement = categories.find((c) => c.id !== category.id && c.type === category.type);
        if (replacement) {
          deleteCategoryMutation.mutate({ id: category.id, replacement_id: replacement.id });
        }
      }
    }
  };

  const handleConfirmReassignDelete = async (categoryId: string, replacementId: string) => {
    await deleteCategoryMutation.mutateAsync({ id: categoryId, replacement_id: replacementId });
    setCategoryToDelete(null);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
          Pengaturan Keuangan
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-semibold">
          Kustomisasi tema tampilan, saldo awal keluarga, dan kelola kategori transaksi
        </p>
      </div>

      {/* Section 1: Tema & Tampilan Pasangan */}
      <ThemeSwitcherSection />

      {/* Section 2: Saldo Awal (Initial Balance) */}
      <Card className="p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-highlight border-2 border-border-color flex items-center justify-center text-primary shadow-[0_2px_0_0_var(--border-color)]">
            <Wallet className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-text-primary">Saldo Awal Keluarga</h2>
            <p className="text-xs text-text-secondary font-semibold">
              Saldo kas awal sebelum pencatatan transaksi dimulai (Saldo = Saldo Awal + Total Income - Total Expense)
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Nominal Saldo Awal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-text-secondary z-10 pointer-events-none">
                Rp
              </span>
              <Input
                type="number"
                step="any"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
                className="pl-12 font-black text-base"
                disabled={isLoadingSettings}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="3d"
            disabled={updateSettingsMutation.isPending}
            className="btn-3d py-2.5 px-6 flex items-center justify-center gap-2"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSettingsSaved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Saldo Awal</span>
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Card 2: Kelola Kategori */}
      <Card className="p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-highlight border-2 border-border-color flex items-center justify-center text-primary shadow-[0_2px_0_0_var(--border-color)]">
              <Tag className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-text-primary">Manajemen Kategori</h2>
              <p className="text-xs text-text-secondary font-semibold">
                Kelola kategori pemasukan dan pengeluaran sesuai kebiasaan keluarga Anda
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingCat(true)}
            className="self-start sm:self-auto flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 text-primary stroke-[3]" />
            <span>Tambah Kategori</span>
          </Button>
        </div>

        {/* Tab Selection: Pengeluaran vs Pemasukan */}
        <div className="flex gap-2 p-1.5 bg-highlight rounded-2xl border-2 border-border-color">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveCategoryTab("expense")}
            className={`flex-1 py-2 px-3 text-xs font-extrabold ${
              activeCategoryTab === "expense"
                ? "bg-card-surface text-text-primary border-2 border-border-color shadow-[0_2px_0_0_var(--border-color)]"
                : "text-text-secondary hover:text-text-primary border-2 border-transparent"
            }`}
          >
            Kategori Pengeluaran ({categories.filter((c) => c.type === "expense").length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveCategoryTab("income")}
            className={`flex-1 py-2 px-3 text-xs font-extrabold ${
              activeCategoryTab === "income"
                ? "bg-card-surface text-primary border-2 border-primary shadow-[0_2px_0_0_var(--border-color)]"
                : "text-text-secondary hover:text-text-primary border-2 border-transparent"
            }`}
          >
            Kategori Pemasukan ({categories.filter((c) => c.type === "income").length})
          </Button>
        </div>

        {/* Add Category Form Inline */}
        {isAddingCat && (
          <form
            onSubmit={handleAddCategory}
            className="p-4 bg-highlight/50 border-2 border-primary/40 rounded-2xl flex flex-col gap-3 animate-in fade-in shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-primary uppercase tracking-wider">
                + Tambah Kategori {activeCategoryTab === "expense" ? "Pengeluaran" : "Pemasukan"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingCat(false)}
                className="h-7 text-xs text-text-secondary hover:text-text-primary font-bold"
              >
                Tutup
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="text"
                placeholder="Nama Kategori (misal: Investasi, Zakat, dll)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-bold shrink-0">Warna Label:</span>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-10 h-9 rounded-xl cursor-pointer border-2 border-border-color shrink-0"
                />
                <Button
                  type="submit"
                  variant="3d"
                  disabled={createCategoryMutation.isPending || !newCatName.trim()}
                  className="flex-1 py-2 px-4 text-xs"
                >
                  Simpan Kategori
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Category Items Grid */}
        {isLoadingCategories ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-card-surface border-2 border-border-color rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-[0_2px_0_0_var(--border-color)] hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 border-2 border-border-color shadow-xs font-black"
                    style={{ backgroundColor: cat.color || "var(--primary)" }}
                  >
                    <Tag className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-xs text-text-primary truncate">{cat.name}</span>
                    <span className="text-[10px] text-text-secondary font-semibold">
                      {cat.transaction_count || 0} transaksi
                    </span>
                  </div>
                </div>

                {!cat.is_system && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategoryClick(cat)}
                    className="h-8 w-8 p-0 text-text-secondary hover:text-red-500 hover:bg-red-500/10"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Category Reassign Confirmation Modal */}
      <DeleteCategoryDialog
        category={categoryToDelete}
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        categories={categories}
        onConfirm={handleConfirmReassignDelete}
      />
    </div>
  );
}
