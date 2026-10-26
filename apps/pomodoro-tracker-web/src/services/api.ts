import axios from "axios";
import { redirectToLogin } from "./session-url";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      redirectToLogin();
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan";

    // The offline queue needs to tell "the server rejected this" (drop it)
    // apart from "we could not reach the server" (retry later), so the HTTP
    // status is preserved on the thrown error. `undefined` means no response.
    // The rules that read it live in `api-errors.ts`.
    const wrapped = new Error(message) as Error & { status?: number };
    wrapped.status = error.response?.status;
    return Promise.reject(wrapped);
  }
);
