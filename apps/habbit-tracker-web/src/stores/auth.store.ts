import { create } from "zustand";
import type { User } from "../types/index";

const API_BASE = import.meta.env.VITE_BASE_URL_API
  ? `${import.meta.env.VITE_BASE_URL_API}/api`
  : "/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
}

const getStoredUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  login: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    localStorage.removeItem("user");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  clearSession: () => {
    localStorage.removeItem("user");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
