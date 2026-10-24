import type { GroceryItem } from "@repo/types";
import { api } from "./api";

/**
 * Grocery data is shared between partners, so there is intentionally no local
 * fallback: a failed request surfaces as an error instead of silently writing
 * to localStorage and pretending the item was saved. `api` already rejects with
 * a human-readable Error message (and redirects to login on 401).
 */
export const groceryService = {
  async getItems(): Promise<GroceryItem[]> {
    const response = await api.get<{ items: GroceryItem[] }>("/grocery");
    return response.data.items ?? [];
  },

  async createItem(payload: {
    name: string;
    category?: string;
    quantity?: string;
    unit?: string | null;
    estimated_price?: number | null;
    is_urgent?: boolean;
  }): Promise<GroceryItem> {
    const response = await api.post<{ item: GroceryItem }>("/grocery", payload);
    return response.data.item;
  },

  async updateItem(id: string, payload: Partial<GroceryItem>): Promise<GroceryItem> {
    const response = await api.put<{ item: GroceryItem }>(`/grocery/${id}`, payload);
    return response.data.item;
  },

  async toggleComplete(id: string, is_completed: boolean): Promise<GroceryItem> {
    const response = await api.patch<{ item: GroceryItem }>(`/grocery/${id}/toggle`, {
      is_completed,
    });
    return response.data.item;
  },

  async deleteItem(id: string): Promise<boolean> {
    await api.delete(`/grocery/${id}`);
    return true;
  },

  async clearCompleted(): Promise<number> {
    const response = await api.post<{ deletedCount: number }>("/grocery/clear-completed");
    return response.data.deletedCount;
  },
};
