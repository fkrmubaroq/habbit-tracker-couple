import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Heart,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { groceryService } from "../../services/grocery.service";
import { useAuthStore } from "../../stores/auth.store";
import { useToastStore } from "../../stores/toast.store";

export const Route = createFileRoute("/grocery-list/settings")({
  component: GrocerySettingsPage,
});

function GrocerySettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [copied, setCopied] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  // Fetch items for share text generation
  const { data: items = [] } = useQuery({
    queryKey: ["grocery-items"],
    queryFn: () => groceryService.getItems(),
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

  // Delete All Mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      for (const it of items) {
        await groceryService.deleteItem(it.id);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      setShowClearConfirm(false);
      addToast("Semua barang belanjaan telah dihapus", "success");
    },
  });

  // Generate WhatsApp Share Text
  const generateShareText = () => {
    const pendingList = items.filter((i) => !i.is_completed);
    const completedList = items.filter((i) => i.is_completed);

    let text = `🛒 *Daftar Belanjaan Pasutri*\n`;
    text += `Tanggal: ${new Date().toLocaleDateString("id-ID", { dateStyle: "medium" })}\n\n`;

    if (pendingList.length > 0) {
      text += `*Perlu Dibeli (${pendingList.length}):*\n`;
      pendingList.forEach((it, idx) => {
        text += `${idx + 1}. [ ] ${it.name} (${it.quantity} ${it.unit || ""})${it.is_urgent ? " 🔥" : ""}\n`;
      });
      text += `\n`;
    }

    if (completedList.length > 0) {
      text += `*Sudah Dibeli (${completedList.length}):*\n`;
      completedList.forEach((it) => {
        text += `• [✓] ~${it.name}~\n`;
      });
    }

    return text;
  };

  const handleCopyText = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast("Daftar belanjaan berhasil disalin!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="h-13 w-13 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
            ⚙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                Pengaturan Grocery List
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Mini App
              </span>
            </div>
            <p className="text-xs font-bold text-text-secondary mt-0.5">
              Kelola sinkronisasi, bagikan belanjaan, dan preferensi daftar
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Sinkronisasi Pasutri */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-black text-text-primary">Status Sinkronisasi Pasutri</h2>
        </div>
        <p className="text-xs font-semibold text-text-secondary mb-4 leading-relaxed">
          Setiap barang belanjaan yang kamu atau pasanganmu tambahkan otomatis tersinkronisasi dan dapat dicentang bersama.
        </p>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-highlight border-2 border-border-color">
          {user?.avatar_image ? (
            <img src={user.avatar_image} alt={user.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <span className="text-2xl">{user?.avatar_emoji || "🦖"}</span>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-text-primary">{user?.name}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {user?.role === "husband" ? "Suami" : "Istri"} • Ruang Belanja Bersama
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Bagikan ke WhatsApp */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-black text-text-primary">Bagikan Daftar Belanja</h2>
        </div>
        <p className="text-xs font-semibold text-text-secondary mb-4 leading-relaxed">
          Kirimkan daftar barang yang perlu dibeli ke WhatsApp pasangan sebelum berangkat belanja.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="3d-secondary"
            onClick={handleShareWhatsApp}
            disabled={items.length === 0}
            className="flex items-center gap-2 font-black text-xs h-10 px-4"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Kirim via WhatsApp</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyText}
            disabled={items.length === 0}
            className="flex items-center gap-2 font-bold text-xs h-10 px-4"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Tersalin!" : "Salin Teks Belanjaan"}</span>
          </Button>
        </div>
      </div>

      {/* Section 3: Tindakan Data & Reset */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 mb-2">
          <RotateCcw className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-black text-text-primary">Aksi Cepat & Reset</h2>
        </div>
        <p className="text-xs font-semibold text-text-secondary mb-4 leading-relaxed">
          Gunakan opsi ini saat ingin mengulang belanja mingguan atau membersihkan daftar.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="outline"
            onClick={() => resetAllMutation.mutate()}
            disabled={resetAllMutation.isPending || !items.some((i) => i.is_completed)}
            className="flex items-center gap-2 font-extrabold text-xs h-10"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Semua Centang Belanja</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowClearConfirm(true)}
            disabled={items.length === 0}
            className="flex items-center gap-2 font-extrabold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 h-10"
          >
            <Trash2 className="h-4 w-4" />
            <span>Hapus Semua Barang Belanja</span>
          </Button>
        </div>
      </div>

      {/* Section 4: Navigasi Cepat */}
      <div className="bg-card-surface border-3 border-border-color rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_var(--border-color)]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-black text-text-primary">Pintas Menu Lain</h2>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-highlight border-2 border-border-color hover:border-primary transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💖</span>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-text-primary">Habit Pasutri</span>
                <span className="text-xs font-medium text-text-secondary">
                  Kembali ke pelacak kebiasaan & streak utama
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-secondary" />
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/settings" })}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-highlight border-2 border-border-color hover:border-primary transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎨</span>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-text-primary">Pengaturan Profil & Tema</span>
                <span className="text-xs font-medium text-text-secondary">
                  Ubah tema Sakura/Duo, password, dan foto profil
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Confirm Delete All Dialog */}
      {showClearConfirm && (
        <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <DialogContent className="max-w-md rounded-3xl border-3 border-border-color">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-text-primary">
                Hapus Semua Barang Belanjaan?
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs font-semibold text-text-secondary py-2">
              Tindakan ini akan menghapus semua barang belanjaan yang ada di daftar kamu dan pasangan.
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="font-bold">
                Batal
              </Button>
              <Button
                variant="3d"
                onClick={() => deleteAllMutation.mutate()}
                className="bg-rose-500 hover:bg-rose-600 text-white font-black border-rose-700"
              >
                Ya, Hapus Semua
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
