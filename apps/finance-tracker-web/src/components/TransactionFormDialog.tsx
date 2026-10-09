import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTransactionDTO, createTransactionSchema } from "@repo/types";
import confetti from "canvas-confetti";
import { ArrowDownRight, ArrowUpRight, Calendar, FileText, Loader2, Tag } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useCreateTransactionMutation, useFinanceCategories } from "../hooks/use-finance";
import { useFinanceUIStore } from "../stores/finance-ui.store";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  Textarea,
} from "./ui";

export function TransactionFormDialog() {
  const { isTransactionModalOpen, defaultTransactionType, closeTransactionModal } = useFinanceUIStore();
  const { data: categories = [], isLoading: isLoadingCategories } = useFinanceCategories();
  const createTxMutation = useCreateTransactionMutation();

  const todayStr = new Date().toISOString().substring(0, 10);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTransactionDTO>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: defaultTransactionType,
      amount: undefined as any,
      description: "",
      date: todayStr,
      category_id: "",
      notes: "",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (isTransactionModalOpen) {
      setValue("type", defaultTransactionType);
      setValue("date", todayStr);
    }
  }, [isTransactionModalOpen, defaultTransactionType, setValue, todayStr]);

  // Filter categories by selected type
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  // Set default category when type changes or categories load
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const currentCatId = watch("category_id");
      const exists = filteredCategories.some((c) => c.id === currentCatId);
      if (!exists) {
        setValue("category_id", filteredCategories[0].id);
      }
    }
  }, [selectedType, filteredCategories, setValue, watch]);

  const onSubmit = async (data: CreateTransactionDTO) => {
    try {
      await createTxMutation.mutateAsync(data);
      if (data.type === "income") {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
      reset();
      closeTransactionModal();
    } catch (err) {
      // Handled by react-query
    }
  };


  return (
    <Dialog open={isTransactionModalOpen} onOpenChange={(open) => !open && closeTransactionModal()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-text-primary">Catat Transaksi</DialogTitle>
          <DialogDescription className="sr-only">
            Form pencatatan transaksi keuangan baru
          </DialogDescription>
        </DialogHeader>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 pt-2">
          {/* Type Toggle: Expense vs Income */}
          <div className="flex gap-2 p-1.5 bg-highlight rounded-2xl border-2 border-border-color">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setValue("type", "expense")}
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedType === "expense"
                ? "bg-card-surface text-text-primary border-2 border-border-color shadow-[0_2px_0_0_var(--border-color)]"
                : "text-text-secondary hover:text-text-primary border-2 border-transparent"
                }`}
            >
              <ArrowDownRight className="h-4 w-4 stroke-[3]" />
              <span>Pengeluaran</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setValue("type", "income")}
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedType === "income"
                ? "bg-card-surface text-primary border-2 border-primary shadow-[0_2px_0_0_var(--border-color)]"
                : "text-text-secondary hover:text-text-primary border-2 border-transparent"
                }`}
            >
              <ArrowUpRight className="h-4 w-4 stroke-[3]" />
              <span>Pemasukan</span>
            </Button>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Nominal (Rp)
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-text-secondary z-10 pointer-events-none">
                    Rp
                  </span>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    className="pl-12 pr-4 py-3 font-black text-xl"
                  />
                </div>
              )}
            />
            {errors.amount && (
              <span className="text-xs font-semibold text-red-500">{errors.amount.message}</span>
            )}
          </div>

          {/* Category Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
              <span>Kategori</span>
            </label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  disabled={isLoadingCategories}
                >
                  <option value="" disabled>
                    Pilih Kategori...
                  </option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.category_id && (
              <span className="text-xs font-semibold text-red-500">{errors.category_id.message}</span>
            )}
          </div>

          {/* Date Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
              <span>Tanggal</span>
            </label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Input
                  type="date"
                  {...field}
                />
              )}
            />
            {errors.date && (
              <span className="text-xs font-semibold text-red-500">{errors.date.message}</span>
            )}
          </div>

          {/* Description Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
              <span>Deskripsi / Keterangan</span>
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  placeholder="Contoh: Belanja mingguan di pasar, Gaji bulanan..."
                  {...field}
                />
              )}
            />
            {errors.description && (
              <span className="text-xs font-semibold text-red-500">{errors.description.message}</span>
            )}
          </div>

          {/* Notes Input (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Catatan Tambahan (Opsional)
            </label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  rows={2}
                  placeholder="Catatan tambahan bila diperlukan..."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  className="resize-none"
                />
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeTransactionModal}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="3d"
              disabled={createTxMutation.isPending}
              className="flex-1"
            >
              {createTxMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Transaksi</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
