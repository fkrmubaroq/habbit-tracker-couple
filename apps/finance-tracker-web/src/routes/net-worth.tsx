import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Coins,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  Wallet,
  Building,
  Loader2,
} from "lucide-react";
import {
  useFinanceNetWorth,
  useCreateAssetMutation,
  useDeleteAssetMutation,
  useCreateLiabilityMutation,
  useDeleteLiabilityMutation,
} from "../hooks/use-finance";
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

export const Route = createFileRoute("/net-worth")({
  component: NetWorthPage,
});

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function NetWorthPage() {
  const { data: netWorthData, isLoading } = useFinanceNetWorth();

  const createAssetMutation = useCreateAssetMutation();
  const deleteAssetMutation = useDeleteAssetMutation();
  const createLiabilityMutation = useCreateLiabilityMutation();
  const deleteLiabilityMutation = useDeleteLiabilityMutation();

  // Add Asset Modal state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("Tabungan");
  const [assetAmount, setAssetAmount] = useState<number | "">("");

  // Add Liability Modal state
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [liabilityName, setLiabilityName] = useState("");
  const [liabilityCategory, setLiabilityCategory] = useState("Pinjaman");
  const [liabilityAmount, setLiabilityAmount] = useState<number | "">("");

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetAmount || Number(assetAmount) <= 0) return;

    await createAssetMutation.mutateAsync({
      name: assetName.trim(),
      category: assetCategory,
      amount: Number(assetAmount),
    });

    setAssetName("");
    setAssetAmount("");
    setIsAssetModalOpen(false);
  };

  const handleSaveLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabilityName.trim() || !liabilityAmount || Number(liabilityAmount) <= 0) return;

    await createLiabilityMutation.mutateAsync({
      name: liabilityName.trim(),
      category: liabilityCategory,
      amount: Number(liabilityAmount),
    });

    setLiabilityName("");
    setLiabilityAmount("");
    setIsLiabilityModalOpen(false);
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    if (confirm(`Hapus aset "${name}"?`)) {
      await deleteAssetMutation.mutateAsync(id);
    }
  };

  const handleDeleteLiability = async (id: string, name: string) => {
    if (confirm(`Hapus liabilitas "${name}"?`)) {
      await deleteLiabilityMutation.mutateAsync(id);
    }
  };

  if (isLoading || !netWorthData) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const {
    current_balance,
    total_assets,
    total_liabilities,
    net_worth,
    assets = [],
    liabilities = [],
  } = netWorthData;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
          Kekayaan Bersih (Net Worth)
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-semibold">
          Pantau seluruh aset likuid, investasi, dan liabilitas keluarga dalam satu tempat
        </p>
      </div>

      {/* Hero Net Worth Card */}
      <Card className="p-6 md:p-8 shadow-[0_4px_0_0_var(--border-color)] relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/15 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-highlight border-2 border-border-color flex items-center justify-center text-primary shadow-[0_2px_0_0_var(--border-color)]">
                <Coins className="h-6 w-6 stroke-[2.5]" />
              </div>
              <span className="text-xs uppercase tracking-wider font-black text-text-secondary">
                Total Kekayaan Bersih Pasutri
              </span>
            </div>

            <span className="text-xs font-extrabold px-3.5 py-1.5 bg-highlight text-primary rounded-full border-2 border-border-color shadow-xs">
              Aktif & Terkalkulasi
            </span>
          </div>

          <div>
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-text-primary tracking-tight block">
              {formatRupiah(net_worth)}
            </span>
            <p className="text-xs text-text-secondary font-semibold mt-2">
              Formula: (Saldo Kas Berjalan + Total Aset Tambahan) - Total Liabilitas
            </p>
          </div>

          {/* Sub summary: Total Assets vs Total Liabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-border-color">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
                Total Aset (Kepemilikan)
              </span>
              <span className="text-xl font-black text-primary mt-0.5">
                {formatRupiah(total_assets)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-text-secondary">
                Total Liabilitas (Hutang)
              </span>
              <span className="text-xl font-black text-red-500 mt-0.5">
                {formatRupiah(total_liabilities)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Grid: Assets vs Liabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Assets */}
        <Card className="p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-primary font-extrabold text-base">
              <ShieldCheck className="h-5 w-5 text-primary stroke-[2.5]" />
              <span>Daftar Aset ({assets.length + 1})</span>
            </div>
            <Button
              type="button"
              variant="3d"
              size="sm"
              onClick={() => setIsAssetModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Tambah Aset</span>
            </Button>
          </div>

          {/* Cash Balance Item (Auto synced) */}
          <div className="bg-card-surface border-2 border-primary/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[0_2px_0_0_var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-highlight border-2 border-primary/30 text-primary flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-text-primary">Saldo Kas Berjalan</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                  Otomatis dari mutasi transaksi
                </span>
              </div>
            </div>
            <span className="font-black text-sm text-primary">
              {formatRupiah(current_balance)}
            </span>
          </div>

          {/* Manual Assets list */}
          {assets.map((ast) => (
            <div
              key={ast.id}
              className="bg-card-surface border-2 border-border-color rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[0_2px_0_0_var(--border-color)] hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-highlight border-2 border-border-color text-text-secondary flex items-center justify-center shrink-0">
                  <Building className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm text-text-primary truncate">{ast.name}</span>
                  <span className="text-[11px] font-semibold text-text-secondary">
                    {ast.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-black text-sm text-text-primary">
                  {formatRupiah(ast.amount)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAsset(ast.id, ast.name)}
                  className="h-8 w-8 p-0 text-text-secondary hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </Card>

        {/* Right Column: Liabilities */}
        <Card className="p-6 shadow-[0_4px_0_0_var(--border-color)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-primary font-extrabold text-base">
              <AlertTriangle className="h-5 w-5 text-red-500 stroke-[2.5]" />
              <span>Daftar Liabilitas / Hutang ({liabilities.length})</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLiabilityModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Tambah Hutang</span>
            </Button>
          </div>

          {liabilities.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-text-secondary border-2 border-dashed border-border-color rounded-2xl">
              Keluarga Anda tidak memiliki catatan hutang/liabilitas. Kondisi finansial sangat sehat!
            </div>
          ) : (
            liabilities.map((lib) => (
              <div
                key={lib.id}
                className="bg-card-surface border-2 border-border-color rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[0_2px_0_0_var(--border-color)] hover:border-red-500/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-highlight border-2 border-border-color text-red-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-sm text-text-primary truncate">{lib.name}</span>
                    <span className="text-[11px] font-semibold text-text-secondary">
                      {lib.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-sm text-red-500">
                    {formatRupiah(lib.amount)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLiability(lib.id, lib.name)}
                    className="h-8 w-8 p-0 text-text-secondary hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Add Asset Modal */}
      <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-base text-text-primary">
              + Tambah Aset
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Catat aset baru untuk menghitung kekayaan bersih keluarga Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAsset} className="flex flex-col gap-3 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Nama Aset</label>
              <Input
                type="text"
                placeholder="Contoh: Deposito Bank, Saham BBCA, Emas Antam..."
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Kategori Aset</label>
              <Select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
              >
                <option value="Tabungan">Tabungan / Rekening</option>
                <option value="Investasi">Investasi / Saham / Reksadana</option>
                <option value="Logam Mulia">Logam Mulia / Emas</option>
                <option value="Properti">Properti / Tanah / Bangunan</option>
                <option value="Kendaraan">Kendaraan</option>
                <option value="Lainnya">Aset Lainnya</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Nilai Taksiran Aset (Rp)</label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={assetAmount}
                onChange={(e) => setAssetAmount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssetModalOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="3d"
                disabled={createAssetMutation.isPending || !assetName.trim() || !assetAmount}
                className="flex-1"
              >
                Simpan Aset
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Liability Modal */}
      <Dialog open={isLiabilityModalOpen} onOpenChange={setIsLiabilityModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-base text-text-primary">
              + Tambah Liabilitas
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Catat hutang atau kewajiban finansial yang masih berjalan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveLiability} className="flex flex-col gap-3 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Nama Liabilitas / Hutang</label>
              <Input
                type="text"
                placeholder="Contoh: KPR Rumah, Cicilan Kendaraan, Kartu Kredit..."
                value={liabilityName}
                onChange={(e) => setLiabilityName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Kategori</label>
              <Select
                value={liabilityCategory}
                onChange={(e) => setLiabilityCategory(e.target.value)}
              >
                <option value="KPR">KPR</option>
                <option value="Kendaraan">Cicilan Kendaraan</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
                <option value="Pinjaman Bank">Pinjaman Bank</option>
                <option value="Lainnya">Hutang Lainnya</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Sisa Hutang (Rp)</label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={liabilityAmount}
                onChange={(e) => setLiabilityAmount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLiabilityModalOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="3d"
                disabled={createLiabilityMutation.isPending || !liabilityName.trim() || !liabilityAmount}
                className="flex-1"
              >
                Simpan Liabilitas
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
