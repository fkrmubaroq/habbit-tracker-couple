import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { FinanceCategory } from "@repo/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Select,
} from "./ui";

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

  if (!category) return null;

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-text-primary">
            <AlertTriangle className="h-5 w-5 text-red-500 stroke-[2.5]" />
            <DialogTitle className="text-base font-black">
              Hapus Kategori "{category.name}"
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-text-secondary leading-relaxed font-semibold pt-1">
            Kategori ini digunakan dalam transaksi keuangan. Sebelum dihapus, semua transaksi terkait harus dialihkan ke kategori pengganti agar riwayat keuangan Anda tetap utuh.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Pilih Kategori Pengganti:
            </label>
            <Select
              value={replacementId}
              onChange={(e) => {
                setReplacementId(e.target.value);
                setError(null);
              }}
            >
              <option value="">-- Pilih Kategori Pengganti --</option>
              {availableReplacements.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-xs font-bold text-red-500">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting || !replacementId}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Alihkan & Hapus</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
