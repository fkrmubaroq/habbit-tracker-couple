import { api } from "./api";
import {
  FinanceOverview,
  FinanceSettings,
  FinanceCategory,
  FinanceTransaction,
  FinanceBudget,
  FinanceReport,
  FinanceAsset,
  FinanceLiability,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateBudgetDTO,
  UpdateBudgetDTO,
  CreateAssetDTO,
  UpdateAssetDTO,
  CreateLiabilityDTO,
  UpdateLiabilityDTO,
  ApiResponse,
} from "@repo/types";

export const financeService = {
  // Overview
  async getOverview(): Promise<FinanceOverview> {
    const res = await api.get<ApiResponse<FinanceOverview>>("/overview");
    return res.data.data!;
  },

  // Settings
  async getSettings(): Promise<FinanceSettings> {
    const res = await api.get<ApiResponse<FinanceSettings>>("/settings");
    return res.data.data!;
  },

  async updateSettings(initial_balance: number): Promise<FinanceSettings> {
    const res = await api.put<ApiResponse<FinanceSettings>>("/settings", { initial_balance });
    return res.data.data!;
  },

  // Categories
  async getCategories(): Promise<FinanceCategory[]> {
    const res = await api.get<ApiResponse<FinanceCategory[]>>("/categories");
    return res.data.data!;
  },

  async createCategory(dto: CreateCategoryDTO): Promise<FinanceCategory> {
    const res = await api.post<ApiResponse<FinanceCategory>>("/categories", dto);
    return res.data.data!;
  },

  async updateCategory(id: string, dto: UpdateCategoryDTO): Promise<FinanceCategory> {
    const res = await api.put<ApiResponse<FinanceCategory>>(`/categories/${id}`, dto);
    return res.data.data!;
  },

  async deleteCategory(id: string, replacement_id: string): Promise<void> {
    await api.delete(`/categories/${id}`, { data: { replacement_id } });
  },

  // Transactions
  async getTransactions(params?: {
    type?: "income" | "expense";
    category_id?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: FinanceTransaction[]; meta: { total: number; page: number; limit: number } }> {
    const res = await api.get<{ success: boolean; data: FinanceTransaction[]; meta: any }>("/transactions", { params });
    return { transactions: res.data.data, meta: res.data.meta };
  },

  async createTransaction(dto: CreateTransactionDTO): Promise<FinanceTransaction> {
    const res = await api.post<ApiResponse<FinanceTransaction>>("/transactions", dto);
    return res.data.data!;
  },

  async updateTransaction(id: string, dto: UpdateTransactionDTO): Promise<FinanceTransaction> {
    const res = await api.put<ApiResponse<FinanceTransaction>>(`/transactions/${id}`, dto);
    return res.data.data!;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  // Budgets
  async getBudgets(month_year?: string): Promise<FinanceBudget[]> {
    const res = await api.get<ApiResponse<FinanceBudget[]>>("/budgets", { params: { month_year } });
    return res.data.data!;
  },

  async createBudget(dto: CreateBudgetDTO): Promise<FinanceBudget> {
    const res = await api.post<ApiResponse<FinanceBudget>>("/budgets", dto);
    return res.data.data!;
  },

  async updateBudget(id: string, dto: UpdateBudgetDTO): Promise<FinanceBudget> {
    const res = await api.put<ApiResponse<FinanceBudget>>(`/budgets/${id}`, dto);
    return res.data.data!;
  },

  async deleteBudget(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },

  // Reports
  async getReports(startDate: string, endDate: string): Promise<FinanceReport> {
    const res = await api.get<ApiResponse<FinanceReport>>("/reports", { params: { startDate, endDate } });
    return res.data.data!;
  },

  // Net Worth & Assets / Liabilities
  async getNetWorth(): Promise<{
    current_balance: number;
    manual_assets_total: number;
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    assets: FinanceAsset[];
    liabilities: FinanceLiability[];
  }> {
    const res = await api.get<ApiResponse<any>>("/net-worth");
    return res.data.data!;
  },

  async getAssets(): Promise<FinanceAsset[]> {
    const res = await api.get<ApiResponse<FinanceAsset[]>>("/assets");
    return res.data.data!;
  },

  async createAsset(dto: CreateAssetDTO): Promise<FinanceAsset> {
    const res = await api.post<ApiResponse<FinanceAsset>>("/assets", dto);
    return res.data.data!;
  },

  async updateAsset(id: string, dto: UpdateAssetDTO): Promise<FinanceAsset> {
    const res = await api.put<ApiResponse<FinanceAsset>>(`/assets/${id}`, dto);
    return res.data.data!;
  },

  async deleteAsset(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  },

  async getLiabilities(): Promise<FinanceLiability[]> {
    const res = await api.get<ApiResponse<FinanceLiability[]>>("/liabilities");
    return res.data.data!;
  },

  async createLiability(dto: CreateLiabilityDTO): Promise<FinanceLiability> {
    const res = await api.post<ApiResponse<FinanceLiability>>("/liabilities", dto);
    return res.data.data!;
  },

  async updateLiability(id: string, dto: UpdateLiabilityDTO): Promise<FinanceLiability> {
    const res = await api.put<ApiResponse<FinanceLiability>>(`/liabilities/${id}`, dto);
    return res.data.data!;
  },

  async deleteLiability(id: string): Promise<void> {
    await api.delete(`/liabilities/${id}`);
  },
};
