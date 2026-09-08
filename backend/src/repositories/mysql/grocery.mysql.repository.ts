import { RowDataPacket, ResultSetHeader } from "mysql2";
import { mysqlPool } from "../../config/database.js";
import { GroceryItem } from "../../types/index.js";
import { IGroceryRepository } from "../interfaces/grocery.repository.interface.js";

export class GroceryMySQLRepository implements IGroceryRepository {
  private mapItem(row: any): GroceryItem {
    return {
      ...row,
      is_urgent: Boolean(row.is_urgent),
      is_completed: Boolean(row.is_completed),
      estimated_price: row.estimated_price ? Number(row.estimated_price) : null,
    };
  }

  async findById(id: string): Promise<GroceryItem | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT g.*, u.name as creator_name, u.role as creator_role, c.name as completer_name
       FROM grocery_items g
       LEFT JOIN users u ON g.user_id = u.id
       LEFT JOIN users c ON g.completed_by = c.id
       WHERE g.id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    return this.mapItem(rows[0]);
  }

  async create(item: GroceryItem): Promise<GroceryItem> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    await mysqlPool.execute(
      `INSERT INTO grocery_items 
       (id, user_id, partner_id, name, category, quantity, unit, estimated_price, is_urgent, is_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    return item;
  }

  async update(item: GroceryItem): Promise<GroceryItem> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    await mysqlPool.execute(
      `UPDATE grocery_items 
       SET name = ?, category = ?, quantity = ?, unit = ?, estimated_price = ?, is_urgent = ?
       WHERE id = ?`,
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
    return item;
  }

  async delete(id: string): Promise<boolean> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [result] = await mysqlPool.execute<ResultSetHeader>(
      "DELETE FROM grocery_items WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  async findForCouple(userId: string, partnerId: string | null): Promise<GroceryItem[]> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    let query = `
      SELECT g.*, u.name as creator_name, u.role as creator_role, c.name as completer_name
      FROM grocery_items g
      LEFT JOIN users u ON g.user_id = u.id
      LEFT JOIN users c ON g.completed_by = c.id
    `;
    const params: any[] = [];

    if (partnerId) {
      query += ` WHERE (g.user_id = ? OR g.user_id = ? OR g.partner_id = ? OR g.partner_id = ?)`;
      params.push(userId, partnerId, userId, partnerId);
    } else {
      query += ` WHERE (g.user_id = ? OR g.partner_id = ?)`;
      params.push(userId, userId);
    }

    query += ` ORDER BY g.is_completed ASC, g.is_urgent DESC, g.created_at DESC`;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params);
    return rows.map((row) => this.mapItem(row));
  }

  async toggleComplete(id: string, isCompleted: boolean, completedBy: string | null): Promise<GroceryItem | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const completedAt = isCompleted ? new Date() : null;
    await mysqlPool.execute(
      `UPDATE grocery_items 
       SET is_completed = ?, completed_by = ?, completed_at = ? 
       WHERE id = ?`,
      [isCompleted, isCompleted ? completedBy : null, completedAt, id]
    );
    return this.findById(id);
  }

  async clearCompleted(userId: string, partnerId: string | null): Promise<number> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    let query = `DELETE FROM grocery_items WHERE is_completed = TRUE AND `;
    const params: any[] = [];
    if (partnerId) {
      query += `(user_id = ? OR user_id = ? OR partner_id = ? OR partner_id = ?)`;
      params.push(userId, partnerId, userId, partnerId);
    } else {
      query += `(user_id = ? OR partner_id = ?)`;
      params.push(userId, userId);
    }

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, params);
    return result.affectedRows;
  }
}
