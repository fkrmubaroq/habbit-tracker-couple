import { GroceryItem } from "../../types/index.js";

export interface IGroceryRepository {
  findById(id: string): Promise<GroceryItem | null>;
  create(item: GroceryItem): Promise<GroceryItem>;
  update(item: GroceryItem): Promise<GroceryItem>;
  delete(id: string): Promise<boolean>;
  findForCouple(userId: string, partnerId: string | null): Promise<GroceryItem[]>;
  toggleComplete(id: string, isCompleted: boolean, completedBy: string | null): Promise<GroceryItem | null>;
  clearCompleted(userId: string, partnerId: string | null): Promise<number>;
}
