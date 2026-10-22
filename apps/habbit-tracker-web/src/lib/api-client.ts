import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL_API
    ? `${import.meta.env.VITE_BASE_URL_API}/api`
    : "/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url || "";

    if (status === 401 && !url.includes("/auth/me")) {
      useAuthStore.getState().clearSession();

      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
