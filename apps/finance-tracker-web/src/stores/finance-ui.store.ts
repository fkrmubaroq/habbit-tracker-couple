import { create } from "zustand";

interface FinanceUIState {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export const useFinanceUIStore = create<FinanceUIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
