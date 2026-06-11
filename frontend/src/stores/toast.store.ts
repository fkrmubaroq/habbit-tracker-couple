import { create } from "zustand";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
}

interface ToastState {
  toast: ToastMessage | null;
  showToast: (message: string, type: "success" | "error", duration?: number) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (message, type, duration = 3000) => {
    const id = Math.random().toString();
    set({ toast: { id, message, type, duration } });
    setTimeout(() => {
      set((state) => {
        if (state.toast?.id === id) {
          return { toast: null };
        }
        return {};
      });
    }, duration);
  },
  hideToast: () => set({ toast: null }),
}));
