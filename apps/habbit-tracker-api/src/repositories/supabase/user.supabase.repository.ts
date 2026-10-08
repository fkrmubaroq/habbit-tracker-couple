import { pgPool } from "../../config/database.js";
import { User } from "../../types/index.js";
import { IUserRepository } from "../interfaces/user.repository.interface.js";

export class UserSupabaseRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query("SELECT * FROM users WHERE id = $1", [id]);
    return (rows[0] as User) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query("SELECT * FROM users WHERE username = $1", [username]);
    return (rows[0] as User) || null;
  }

  async findByRole(role: "husband" | "wife"): Promise<User | null> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query("SELECT * FROM users WHERE role = $1 LIMIT 1", [role]);
    return (rows[0] as User) || null;
  }

  async create(user: User): Promise<User> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `INSERT INTO users (id, username, password_hash, name, avatar_emoji, avatar_image, role, partner_id, theme_preferences) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
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
    return rows[0] as User;
  }

  async update(user: User): Promise<User> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query(
      `UPDATE users 
       SET name = $1, avatar_emoji = $2, avatar_image = $3, password_hash = $4, partner_id = $5, theme_preferences = $6 
       WHERE id = $7 RETURNING *`,
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
    return rows[0] as User;
  }

  async count(): Promise<number> {
    if (!pgPool) throw new Error("pgPool not initialized");
    const { rows } = await pgPool.query("SELECT COUNT(*) FROM users");
    return parseInt(rows[0].count, 10) || 0;
  }
}
