import { create } from "zustand";

interface FinanceUIState {
  isTransactionModalOpen: boolean;
  defaultTransactionType: "income" | "expense";
  openTransactionModal: (type?: "income" | "expense") => void;
  closeTransactionModal: () => void;
}

export const useFinanceUIStore = create<FinanceUIState>((set) => ({
  isTransactionModalOpen: false,
  defaultTransactionType: "expense",
  openTransactionModal: (type = "expense") =>
    set({ isTransactionModalOpen: true, defaultTransactionType: type }),
  closeTransactionModal: () =>
    set({ isTransactionModalOpen: false }),
}));
