import { v4 as uuidv4 } from "uuid";
import { executeQuery, testConnection } from "../config/database.js";
import { env } from "../config/env.js";

/**
 * Development-only seed for grocery.
 *
 * `users` belongs to `@repo/habbit-tracker-api` — this seeder never creates or
 * deletes users. It only adds a few sample `grocery_items` for the first
 * existing user so the list is not empty on a fresh dev database.
 */
const SAMPLE_ITEMS = [
  { name: "Telur Ayam", category: "Susu & Telur", quantity: "1", unit: "kg", estimated_price: 32000, is_urgent: true },
  { name: "Bayam & Kangkung", category: "Sayur & Buah", quantity: "2", unit: "ikat", estimated_price: 12000, is_urgent: false },
  { name: "Sabun Cuci Piring", category: "Kebutuhan Rumah", quantity: "1", unit: "botol", estimated_price: 18500, is_urgent: false },
];

async function main() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.warn("Could not connect to database. Skipping seed.");
      process.exit(0);
    }

    if (env.NODE_ENV === "production") {
      console.warn("Refusing to seed sample grocery items in production. Skipping seed.");
      process.exit(0);
    }

    const users = await executeQuery<{ id: string; partner_id: string | null }>(
      `SELECT id, partner_id FROM users ORDER BY created_at ASC LIMIT 1`
    );

    if (users.length === 0) {
      console.warn("No users found. Run the habit API seed first, then re-run this seed.");
      process.exit(0);
    }

    const owner = users[0];
    const existing = await executeQuery<{ total: number | string }>(
      `SELECT COUNT(*) as total FROM grocery_items`
    );
    const total = Number(existing[0]?.total ?? 0);

    if (total > 0) {
      console.log(`grocery_items already has ${total} row(s). Skipping sample seed.`);
      process.exit(0);
    }

    for (const item of SAMPLE_ITEMS) {
      await executeQuery(
        `INSERT INTO grocery_items
         (id, user_id, partner_id, name, category, quantity, unit, estimated_price, is_urgent, is_completed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          owner.id,
          owner.partner_id,
          item.name,
          item.category,
          item.quantity,
          item.unit,
          item.estimated_price,
          item.is_urgent,
          false,
        ]
      );
      console.log(`+ Seeded grocery item: ${item.name}`);
    }

    console.log("Grocery sample seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed runner failed:", error);
    process.exit(1);
  }
}

main();
