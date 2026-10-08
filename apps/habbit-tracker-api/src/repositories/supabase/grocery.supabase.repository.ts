import { pgPool } from "../../config/database.js";
import { GroceryItem } from "../../types/index.js";
import { IGroceryRepository } from "../interfaces/grocery.repository.interface.js";

export class GrocerySupabaseRepository implements IGroceryRepository {
  private mapItem(row: any): GroceryItem {
    return {
      ...row,
      is_urgent: Boolean(row.is_urgent),
      is_completed: Boolean(row.is_completed),
      estimated_price: row.estimated_price ? Number(row.estimated_price) : null,
    };
  }

  async findById(id: string): Promise<GroceryItem | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `SELECT g.*, u.name as creator_name, u.role as creator_role, c.name as completer_name
       FROM grocery_items g
       LEFT JOIN users u ON g.user_id = u.id
       LEFT JOIN users c ON g.completed_by = c.id
       WHERE g.id = $1`,
      [id]
    );
    if (rows.length === 0) return null;
    return this.mapItem(rows[0]);
  }

  async create(item: GroceryItem): Promise<GroceryItem> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `INSERT INTO grocery_items 
       (id, user_id, partner_id, name, category, quantity, unit, estimated_price, is_urgent, is_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        item.id,
        item.user_id,
        item.partner_id || null,
        item.name,
        item.category,
        item.quantity,
        item.unit || null,
        item.estimated_price || null,
        item.is_urgent,
        item.is_completed,
      ]
    );
    return this.mapItem(rows[0]);
  }

  async update(item: GroceryItem): Promise<GroceryItem> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `UPDATE grocery_items 
       SET name = $1, category = $2, quantity = $3, unit = $4, estimated_price = $5, is_urgent = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        item.name,
        item.category,
        item.quantity,
        item.unit || null,
        item.estimated_price || null,
        item.is_urgent,
        item.id,
      ]
    );
    return this.mapItem(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const result = await pgPool.query("DELETE FROM grocery_items WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async findForCouple(userId: string, partnerId: string | null): Promise<GroceryItem[]> {
    if (!pgPool) throw new Error("pgPool not initialized");
    let query = `
      SELECT g.*, u.name as creator_name, u.role as creator_role, c.name as completer_name
      FROM grocery_items g
      LEFT JOIN users u ON g.user_id = u.id
      LEFT JOIN users c ON g.completed_by = c.id
    `;
    const params: any[] = [];

    if (partnerId) {
      query += ` WHERE (g.user_id = $1 OR g.user_id = $2 OR g.partner_id = $1 OR g.partner_id = $2)`;
      params.push(userId, partnerId);
    } else {
      query += ` WHERE (g.user_id = $1 OR g.partner_id = $1)`;
      params.push(userId);
    }

    query += ` ORDER BY g.is_completed ASC, g.is_urgent DESC, g.created_at DESC`;

    const { rows } = await pgPool.query(query, params);
    return rows.map((row) => this.mapItem(row));
  }

  async toggleComplete(id: string, isCompleted: boolean, completedBy: string | null): Promise<GroceryItem | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const completedAt = isCompleted ? new Date() : null;
    const { rows } = await pgPool.query(
      `UPDATE grocery_items 
       SET is_completed = $1, completed_by = $2, completed_at = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [isCompleted, isCompleted ? completedBy : null, completedAt, id]
    );
    if (rows.length === 0) return null;
    return this.findById(id);
  }

  async clearCompleted(userId: string, partnerId: string | null): Promise<number> {
    if (!pgPool) throw new Error("pgPool not initialized");
    let query = `DELETE FROM grocery_items WHERE is_completed = TRUE AND `;
    const params: any[] = [];
    if (partnerId) {
      query += `(user_id = $1 OR user_id = $2 OR partner_id = $1 OR partner_id = $2)`;
      params.push(userId, partnerId);
    } else {
      query += `(user_id = $1 OR partner_id = $1)`;
      params.push(userId);
    }

    const result = await pgPool.query(query, params);
    return result.rowCount ?? 0;
  }
}
