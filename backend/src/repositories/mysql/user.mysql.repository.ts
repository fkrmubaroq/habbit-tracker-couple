import { RowDataPacket, ResultSetHeader } from "mysql2";
import { mysqlPool } from "../../config/database.js";
import { User } from "../../types/index.js";
import { IUserRepository } from "../interfaces/user.repository.interface.js";

export class UserMySQLRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM USERS WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    const user = rows[0] as User;
    // Parse JSON field theme_preferences
    if (typeof user.theme_preferences === "string") {
      user.theme_preferences = JSON.parse(user.theme_preferences);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM USERS WHERE username = ?",
      [username]
    );
    if (rows.length === 0) return null;
    const user = rows[0] as User;
    if (typeof user.theme_preferences === "string") {
      user.theme_preferences = JSON.parse(user.theme_preferences);
    }
    return user;
  }

  async findByRole(role: "husband" | "wife"): Promise<User | null> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT * FROM USERS WHERE role = ? LIMIT 1",
      [role]
    );
    if (rows.length === 0) return null;
    const user = rows[0] as User;
    if (typeof user.theme_preferences === "string") {
      user.theme_preferences = JSON.parse(user.theme_preferences);
    }
    return user;
  }

  async create(user: User): Promise<User> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    await mysqlPool.execute(
      "INSERT INTO USERS (id, username, password_hash, name, avatar_emoji, avatar_image, role, partner_id, theme_preferences) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user.id,
        user.username,
        user.password_hash,
        user.name,
        user.avatar_emoji,
        user.avatar_image,
        user.role,
        user.partner_id,
        user.theme_preferences ? JSON.stringify(user.theme_preferences) : null,
      ]
    );
    return user;
  }

  async update(user: User): Promise<User> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    await mysqlPool.execute(
      "UPDATE USERS SET name = ?, avatar_emoji = ?, avatar_image = ?, password_hash = ?, partner_id = ?, theme_preferences = ? WHERE id = ?",
      [
        user.name,
        user.avatar_emoji,
        user.avatar_image,
        user.password_hash,
        user.partner_id,
        user.theme_preferences ? JSON.stringify(user.theme_preferences) : null,
        user.id,
      ]
    );
    return user;
  }

  async count(): Promise<number> {
    if (!mysqlPool) throw new Error("MySQL pool not initialized");
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM USERS"
    );
    return rows[0].count;
  }
}
