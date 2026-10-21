import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../services/finance.service";
import {
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
} from "@repo/types";

// Query Keys
export const financeKeys = {
  all: ["finance"] as const,
  overview: () => [...financeKeys.all, "overview"] as const,
  settings: () => [...financeKeys.all, "settings"] as const,
  categories: () => [...financeKeys.all, "categories"] as const,
  transactions: (params?: any) => [...financeKeys.all, "transactions", params] as const,
  budgets: (month?: string) => [...financeKeys.all, "budgets", month] as const,
  reports: (startDate?: string, endDate?: string) => [...financeKeys.all, "reports", startDate, endDate] as const,
  netWorth: () => [...financeKeys.all, "net-worth"] as const,
};

// ==========================================
// Overview & Settings Hooks
// ==========================================
export function useFinanceOverview() {
  return useQuery({
    queryKey: financeKeys.overview(),
    queryFn: () => financeService.getOverview(),
  });
}

export function useFinanceSettings() {
  return useQuery({
    queryKey: financeKeys.settings(),
    queryFn: () => financeService.getSettings(),
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (initial_balance: number) => financeService.updateSettings(initial_balance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

// ==========================================
// Categories Hooks
// ==========================================
export function useFinanceCategories() {
  return useQuery({
    queryKey: financeKeys.categories(),
    queryFn: () => financeService.getCategories(),
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryDTO) => financeService.createCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDTO }) => financeService.updateCategory(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, replacement_id }: { id: string; replacement_id: string }) =>
      financeService.deleteCategory(id, replacement_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

// ==========================================
// Transactions Hooks
// ==========================================
export function useFinanceTransactions(params?: {
  type?: "income" | "expense";
  category_id?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: financeKeys.transactions(params),
    queryFn: () => financeService.getTransactions(params),
  });
}

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTransactionDTO) => financeService.createTransaction(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDTO }) =>
      financeService.updateTransaction(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

// ==========================================
// Budgets Hooks
// ==========================================
export function useFinanceBudgets(month_year?: string) {
  return useQuery({
    queryKey: financeKeys.budgets(month_year),
    queryFn: () => financeService.getBudgets(month_year),
  });
}

export function useCreateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBudgetDTO) => financeService.createBudget(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}

export function useUpdateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBudgetDTO }) =>
      financeService.updateBudget(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}

export function useDeleteBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeService.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}

// ==========================================
// Reports Hooks
// ==========================================
export function useFinanceReports(startDate: string, endDate: string) {
  return useQuery({
    queryKey: financeKeys.reports(startDate, endDate),
    queryFn: () => financeService.getReports(startDate, endDate),
    enabled: Boolean(startDate && endDate),
  });
}

// ==========================================
// Net Worth Hooks
// ==========================================
export function useFinanceNetWorth() {
  return useQuery({
    queryKey: financeKeys.netWorth(),
    queryFn: () => financeService.getNetWorth(),
  });
}

export function useCreateAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssetDTO) => financeService.createAsset(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}

export function useUpdateAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAssetDTO }) =>
      financeService.updateAsset(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}

export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}

export function useCreateLiabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLiabilityDTO) => financeService.createLiability(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}

export function useUpdateLiabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLiabilityDTO }) =>
      financeService.updateLiability(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}

export function useDeleteLiabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeService.deleteLiability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
      queryClient.invalidateQueries({ queryKey: financeKeys.overview() });
    },
  });
}
