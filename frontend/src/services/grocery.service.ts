import api from "../lib/api-client";
import type { GroceryItem } from "../types/index";

const LOCAL_STORAGE_KEY = "habbit_pasutri_local_grocery_items";

// Helper for local storage fallback
function getLocalItems(): GroceryItem[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalItems(items: GroceryItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Failed to persist grocery items to localStorage:", err);
  }
}

// Initial sample data if local storage is empty
function ensureInitialSampleData(): GroceryItem[] {
  let items = getLocalItems();
  if (items.length === 0) {
    items = [
      {
        id: "sample-1",
        user_id: "local-user",
        name: "Susu UHT Full Cream 1L",
        category: "Susu & Telur",
        quantity: "2",
        unit: "kotak",
        estimated_price: 38000,
        is_urgent: true,
        is_completed: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "sample-2",
        user_id: "local-user",
        name: "Bawang Merah & Putih",
        category: "Bumbu & Dapur",
        quantity: "500",
        unit: "gram",
        estimated_price: 25000,
        is_urgent: false,
        is_completed: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "sample-3",
        user_id: "local-user",
        name: "Telur Ayam Negeri",
        category: "Susu & Telur",
        quantity: "1",
        unit: "kg",
        estimated_price: 28000,
        is_urgent: true,
        is_completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
    saveLocalItems(items);
  }
  return items;
}

export const groceryService = {
  async getItems(): Promise<GroceryItem[]> {
    try {
      const response = await api.get<{ items: GroceryItem[] }>("/grocery");
      if (response.data && Array.isArray(response.data.items)) {
        // Cache to local storage
        saveLocalItems(response.data.items);
        return response.data.items;
      }
      return ensureInitialSampleData();
    } catch (err) {
      console.warn("API /grocery unavailable, using local storage fallback:", err);
      return ensureInitialSampleData();
    }
  },

  async createItem(payload: {
    name: string;
    category?: string;
    quantity?: string;
    unit?: string | null;
    estimated_price?: number | null;
    is_urgent?: boolean;
  }): Promise<GroceryItem> {
    try {
      const response = await api.post<{ item: GroceryItem }>("/grocery", payload);
      const newItem = response.data.item;
      const current = getLocalItems();
      saveLocalItems([newItem, ...current]);
      return newItem;
    } catch (err) {
      console.warn("API create grocery failed, saving locally:", err);
      const newItem: GroceryItem = {
        id: "local-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        user_id: "me",
        name: payload.name,
        category: payload.category || "Lainnya",
        quantity: payload.quantity || "1",
        unit: payload.unit || null,
        estimated_price: payload.estimated_price || null,
        is_urgent: Boolean(payload.is_urgent),
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      const current = getLocalItems();
      saveLocalItems([newItem, ...current]);
      return newItem;
    }
  },

  async updateItem(id: string, payload: Partial<GroceryItem>): Promise<GroceryItem> {
    try {
      const response = await api.put<{ item: GroceryItem }>(`/grocery/${id}`, payload);
      const updated = response.data.item;
      const current = getLocalItems();
      saveLocalItems(current.map((i) => (i.id === id ? updated : i)));
      return updated;
    } catch (err) {
      console.warn("API update grocery failed, updating locally:", err);
      const current = getLocalItems();
      let updatedItem = current.find((i) => i.id === id);
      if (!updatedItem) throw new Error("Item not found");
      updatedItem = { ...updatedItem, ...payload };
      saveLocalItems(current.map((i) => (i.id === id ? updatedItem! : i)));
      return updatedItem;
    }
  },

  async toggleComplete(id: string, is_completed: boolean): Promise<GroceryItem> {
    try {
      const response = await api.patch<{ item: GroceryItem }>(`/grocery/${id}/toggle`, {
        is_completed,
      });
      const updated = response.data.item;
      const current = getLocalItems();
      saveLocalItems(current.map((i) => (i.id === id ? updated : i)));
      return updated;
    } catch (err) {
      console.warn("API toggle grocery failed, toggling locally:", err);
      const current = getLocalItems();
      const item = current.find((i) => i.id === id);
      if (!item) throw new Error("Item not found");
      const updated: GroceryItem = {
        ...item,
        is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
      };
      saveLocalItems(current.map((i) => (i.id === id ? updated : i)));
      return updated;
    }
  },

  async deleteItem(id: string): Promise<boolean> {
    try {
      await api.delete(`/grocery/${id}`);
      const current = getLocalItems();
      saveLocalItems(current.filter((i) => i.id !== id));
      return true;
    } catch (err) {
      console.warn("API delete grocery failed, deleting locally:", err);
      const current = getLocalItems();
      saveLocalItems(current.filter((i) => i.id !== id));
      return true;
    }
  },

  async clearCompleted(): Promise<number> {
    try {
      const response = await api.post<{ deletedCount: number }>("/grocery/clear-completed");
      const current = getLocalItems();
      saveLocalItems(current.filter((i) => !i.is_completed));
      return response.data.deletedCount;
    } catch (err) {
      console.warn("API clear completed failed, clearing locally:", err);
      const current = getLocalItems();
      const remaining = current.filter((i) => !i.is_completed);
      const deletedCount = current.length - remaining.length;
      saveLocalItems(remaining);
      return deletedCount;
    }
  },
};
