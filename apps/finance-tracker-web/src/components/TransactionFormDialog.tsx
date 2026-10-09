import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import confetti from "canvas-confetti";
import { X, ArrowDownRight, ArrowUpRight, Calendar, FileText, Tag, Loader2 } from "lucide-react";
import { createTransactionSchema, CreateTransactionDTO } from "@repo/types";
import { useFinanceUIStore } from "../stores/finance-ui.store.js";
import { useFinanceCategories, useCreateTransactionMutation } from "../hooks/use-finance.js";

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

  if (!isTransactionModalOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card-surface border-2 border-border-color rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border-color bg-highlight/40">
          <h2 className="text-lg font-black text-text-primary">Catat Transaksi</h2>
          <button
            onClick={closeTransactionModal}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-highlight cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Type Toggle: Expense vs Income */}
          <div className="flex gap-2 p-1.5 bg-highlight rounded-2xl border-2 border-border-color">
            <button
              type="button"
              onClick={() => setValue("type", "expense")}
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedType === "expense"
                  ? "bg-card-surface text-text-primary border-2 border-border-color shadow-[0_2px_0_0_var(--border-color)]"
                  : "text-text-secondary hover:text-text-primary border-2 border-transparent"
              }`}
            >
              <ArrowDownRight className="h-4 w-4 stroke-[3]" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("type", "income")}
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedType === "income"
                  ? "bg-card-surface text-primary border-2 border-primary shadow-[0_2px_0_0_var(--border-color)]"
                  : "text-text-secondary hover:text-text-primary border-2 border-transparent"
              }`}
            >
              <ArrowUpRight className="h-4 w-4 stroke-[3]" />
              <span>Pemasukan</span>
            </button>
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-text-secondary">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 bg-card-surface border-2 border-border-color rounded-xl font-black text-xl text-text-primary focus:outline-hidden focus:border-primary transition-colors"
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
                <select
                  {...field}
                  className="w-full px-4 py-2.5 bg-card-surface border-2 border-border-color rounded-xl font-bold text-sm text-text-primary focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
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
                </select>
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
                <input
                  type="date"
                  {...field}
                  className="w-full px-4 py-2.5 bg-card-surface border-2 border-border-color rounded-xl font-bold text-sm text-text-primary focus:outline-hidden focus:border-primary transition-colors"
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
                <input
                  type="text"
                  placeholder="Contoh: Belanja mingguan di pasar, Gaji bulanan..."
                  {...field}
                  className="w-full px-4 py-2.5 bg-card-surface border-2 border-border-color rounded-xl font-bold text-sm text-text-primary focus:outline-hidden focus:border-primary transition-colors"
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
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan bila diperlukan..."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  className="w-full px-4 py-2.5 bg-card-surface border-2 border-border-color rounded-xl text-sm text-text-primary focus:outline-hidden focus:border-primary transition-colors resize-none"
                />
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 border-border-color hover:bg-highlight text-text-secondary transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createTxMutation.isPending}
              className="btn-3d flex-1 py-3 px-4 rounded-xl font-extrabold text-sm shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_75%,#000)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {createTxMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Transaksi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
