import { v4 as uuidv4 } from "uuid";
import { executeQuery, testConnection } from "../config/database.js";

const DEFAULT_CATEGORIES = [
  // Income
  { name: "Gaji", type: "income", icon: "Wallet", color: "#38B2AC" },
  { name: "Freelance", type: "income", icon: "Laptop", color: "#4FD1C5" },
  { name: "Bisnis", type: "income", icon: "Briefcase", color: "#805AD5" },
  { name: "Bonus", type: "income", icon: "Gift", color: "#D69E2E" },
  { name: "Dividen & Investasi", type: "income", icon: "TrendingUp", color: "#319795" },
  { name: "Lainnya (Pemasukan)", type: "income", icon: "MoreHorizontal", color: "#718096" },
  // Expense
  { name: "Makanan & Minuman", type: "expense", icon: "Utensils", color: "#E53E3E" },
  { name: "Transportasi", type: "expense", icon: "Car", color: "#DD6B20" },
  { name: "Belanja & Kebutuhan", type: "expense", icon: "ShoppingBag", color: "#ED8936" },
  { name: "Tagihan & Utilitas", type: "expense", icon: "Receipt", color: "#D69E2E" },
  { name: "Hiburan & Rekreasi", type: "expense", icon: "Film", color: "#9F7AEA" },
  { name: "Kesehatan", type: "expense", icon: "HeartPulse", color: "#E53E3E" },
  { name: "Pendidikan", type: "expense", icon: "GraduationCap", color: "#3182CE" },
  { name: "Tempat Tinggal", type: "expense", icon: "Home", color: "#4A5568" },
  { name: "Langganan & Servis", type: "expense", icon: "RefreshCw", color: "#805AD5" },
  { name: "Lainnya (Pengeluaran)", type: "expense", icon: "MoreHorizontal", color: "#A0AEC0" },
];

async function seedDefaultCategories() {
  console.log("Seeding default finance categories...");

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await executeQuery(
      `SELECT id FROM finance_categories WHERE name = ? AND type = ? AND is_system = 1 LIMIT 1`,
      [cat.name, cat.type]
    );

    if (existing.length === 0) {
      await executeQuery(
        `INSERT INTO finance_categories (id, user_id, partner_id, name, type, icon, color, is_system)
         VALUES (?, 'system', NULL, ?, ?, ?, ?, 1)`,
        [uuidv4(), cat.name, cat.type, cat.icon, cat.color]
      );
      console.log(`+ Seeded default category: ${cat.name} (${cat.type})`);
    }
  }

  console.log("Default categories seeded successfully!");
}

async function main() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.warn("Could not connect to database. Skipping seed.");
      process.exit(0);
    }
    await seedDefaultCategories();
    process.exit(0);
  } catch (error) {
    console.error("Seed runner failed:", error);
    process.exit(1);
  }
}

main();
