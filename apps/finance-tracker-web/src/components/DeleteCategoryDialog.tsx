import React, { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { FinanceCategory } from "@repo/types";

interface DeleteCategoryDialogProps {
  category: FinanceCategory | null;
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  onConfirm: (categoryId: string, replacementId: string) => Promise<void>;
}

export function DeleteCategoryDialog({
  category,
  isOpen,
  onClose,
  categories,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const [replacementId, setReplacementId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  // Replacement candidates must be of same type, not the same category, and not system/archived if applicable
  const availableReplacements = categories.filter(
    (c) => c.id !== category.id && c.type === category.type
  );

  const handleConfirm = async () => {
    if (!replacementId) {
      setError("Silakan pilih kategori pengganti terlebih dahulu");
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm(category.id, replacementId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus kategori");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card-surface border-2 border-border-color rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border-color bg-highlight/40">
          <div className="flex items-center gap-2 text-text-primary font-black text-base">
            <AlertTriangle className="h-5 w-5 text-red-500 stroke-[2.5]" />
            <span>Hapus Kategori "{category.name}"</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-highlight cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-text-secondary leading-relaxed font-semibold">
            Kategori ini digunakan dalam transaksi keuangan. Sebelum dihapus, semua transaksi terkait harus dialihkan ke kategori pengganti agar riwayat keuangan Anda tetap utuh.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Pilih Kategori Pengganti:
            </label>
            <select
              value={replacementId}
              onChange={(e) => {
                setReplacementId(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-2.5 bg-card-surface border-2 border-border-color rounded-xl font-bold text-sm text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
            >
              <option value="">-- Pilih Kategori Pengganti --</option>
              {availableReplacements.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-xs font-bold text-red-500">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm border-2 border-border-color hover:bg-highlight text-text-secondary cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting || !replacementId}
              className="flex-1 py-2.5 px-4 rounded-xl font-extrabold text-sm border-2 border-red-600 bg-red-500 hover:bg-red-600 text-white shadow-[0_3px_0_0_#991b1b] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Alihkan & Hapus</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
