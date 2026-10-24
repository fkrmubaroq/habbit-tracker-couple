import { executeQuery } from "../config/database.js";

export interface UserPartnerLookup {
  id: string;
  partner_id: string | null;
}

/**
 * Read-only view of the `users` table.
 *
 * The `users` table is owned by `@repo/habbit-tracker-api`; grocery only needs
 * `partner_id` to scope the shared shopping list to a couple. Nothing here
 * ever writes to `users`.
 */
export class UserReadRepository {
  async findById(id: string): Promise<UserPartnerLookup | null> {
    const rows = await executeQuery<UserPartnerLookup>(
      `SELECT id, partner_id FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}
