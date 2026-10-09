import { z } from "zod";

// ==========================================
// 1. Core Enums & Primitive Types
// ==========================================
export type TransactionType = "income" | "expense";
export type BudgetPeriod = "monthly" | "yearly";
export type BudgetStatus = "safe" | "warning" | "danger";

// ==========================================
// 2. Entity Interfaces
// ==========================================

export interface FinanceCategory {
  id: string;
  user_id: string;
  partner_id?: string | null;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_system?: boolean;
  created_at?: Date | string;
  transaction_count?: number;
}

export interface FinanceTransaction {
  id: string;
  user_id: string;
  partner_id?: string | null;
  category_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  notes?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  category?: FinanceCategory;
  creator_name?: string;
}

export interface FinanceBudget {
  id: string;
  user_id: string;
  partner_id?: string | null;
  category_id: string;
  amount: number;
  period: BudgetPeriod;
  month_year: string; // YYYY-MM
  created_at?: Date | string;
  updated_at?: Date | string;
  category?: FinanceCategory;
  spent?: number;
  remaining?: number;
  percentage?: number;
  status?: BudgetStatus;
}

export interface FinanceAsset {
  id: string;
  user_id: string;
  partner_id?: string | null;
  name: string;
  category: string; // Tabungan, Investasi, Properti, Kendaraan, dll
  amount: number;
  notes?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface FinanceLiability {
  id: string;
  user_id: string;
  partner_id?: string | null;
  name: string;
  category: string; // KPR, Kendaraan, Kartu Kredit, Pinjaman, dll
  amount: number;
  notes?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface FinanceSettings {
  id: string;
  user_id: string;
  partner_id?: string | null;
  initial_balance: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface FinanceOverview {
  current_balance: number;
  initial_balance: number;
  total_income_this_month: number;
  total_expense_this_month: number;
  net_cash_flow_this_month: number;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  budget_progress: {
    total_budget: number;
    total_spent: number;
    percentage: number;
  };
  recent_transactions: FinanceTransaction[];
}

export interface CategoryBreakdownItem {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface CashFlowTrendItem {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinanceReport {
  period: {
    start_date: string;
    end_date: string;
  };
  total_income: number;
  total_expense: number;
  net_cash_flow: number;
  average_daily_expense: number;
  expense_by_category: CategoryBreakdownItem[];
  income_by_category: CategoryBreakdownItem[];
  cash_flow_trend: CashFlowTrendItem[];
}

// ==========================================
// 3. Zod Validation Schemas & DTOs
// ==========================================

export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Jenis transaksi harus dipilih",
  }),
  amount: z
    .number({ required_error: "Jumlah transaksi harus diisi" })
    .positive("Jumlah transaksi harus lebih besar dari 0"),
  description: z
    .string({ required_error: "Deskripsi transaksi harus diisi" })
    .min(1, "Deskripsi tidak boleh kosong")
    .max(255, "Deskripsi maksimal 255 karakter"),
  date: z
    .string({ required_error: "Tanggal transaksi harus diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  category_id: z
    .string({ required_error: "Kategori harus dipilih" })
    .min(1, "Kategori wajib dipilih"),
  notes: z.string().optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDTO = z.infer<typeof updateTransactionSchema>;

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: "Nama kategori harus diisi" })
    .min(1, "Nama kategori tidak boleh kosong")
    .max(100, "Nama kategori maksimal 100 karakter"),
  type: z.enum(["income", "expense"], {
    required_error: "Tipe kategori harus income atau expense",
  }),
  icon: z.string().default("Tag"),
  color: z.string().default("#38B2AC"),
});

export const updateCategorySchema = createCategorySchema.partial();

export const deleteCategorySchema = z.object({
  replacement_id: z
    .string({ required_error: "Kategori pengganti harus dipilih" })
    .min(1, "Kategori pengganti tidak boleh kosong"),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryDTO = z.infer<typeof deleteCategorySchema>;

export const createBudgetSchema = z.object({
  category_id: z
    .string({ required_error: "Kategori anggaran harus dipilih" })
    .min(1, "Kategori tidak boleh kosong"),
  amount: z
    .number({ required_error: "Batas anggaran harus diisi" })
    .positive("Batas anggaran harus lebih besar dari 0"),
  month_year: z
    .string({ required_error: "Bulan anggaran harus diisi" })
    .regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM"),
  period: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const updateBudgetSchema = z.object({
  amount: z
    .number({ required_error: "Batas anggaran harus diisi" })
    .positive("Batas anggaran harus lebih besar dari 0"),
});

export type CreateBudgetDTO = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDTO = z.infer<typeof updateBudgetSchema>;

export const createAssetSchema = z.object({
  name: z
    .string({ required_error: "Nama aset harus diisi" })
    .min(1, "Nama aset tidak boleh kosong")
    .max(150, "Nama aset maksimal 150 karakter"),
  category: z.string().default("Tabungan"),
  amount: z
    .number({ required_error: "Nilai aset harus diisi" })
    .positive("Nilai aset harus lebih besar dari 0"),
  notes: z.string().optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial();

export type CreateAssetDTO = z.infer<typeof createAssetSchema>;
export type UpdateAssetDTO = z.infer<typeof updateAssetSchema>;

export const createLiabilitySchema = z.object({
  name: z
    .string({ required_error: "Nama liabilitas harus diisi" })
    .min(1, "Nama liabilitas tidak boleh kosong")
    .max(150, "Nama liabilitas maksimal 150 karakter"),
  category: z.string().default("Pinjaman"),
  amount: z
    .number({ required_error: "Nilai liabilitas harus diisi" })
    .positive("Nilai liabilitas harus lebih besar dari 0"),
  notes: z.string().optional().nullable(),
});

export const updateLiabilitySchema = createLiabilitySchema.partial();

export type CreateLiabilityDTO = z.infer<typeof createLiabilitySchema>;
export type UpdateLiabilityDTO = z.infer<typeof updateLiabilitySchema>;

export const updateSettingsSchema = z.object({
  initial_balance: z.number({ required_error: "Saldo awal harus berupa angka" }),
});

export type UpdateSettingsDTO = z.infer<typeof updateSettingsSchema>;
