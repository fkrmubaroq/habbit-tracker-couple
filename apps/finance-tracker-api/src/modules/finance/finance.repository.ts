import { v4 as uuidv4 } from "uuid";
import { executeQuery } from "../../config/database.js";
import {
  FinanceCategory,
  FinanceTransaction,
  FinanceBudget,
  FinanceAsset,
  FinanceLiability,
  FinanceSettings,
  FinanceOverview,
  FinanceReport,
} from "@repo/types";

export class FinanceRepository {
  // Couple condition helper
  private coupleFilter(userId: string, partnerId: string | null, tablePrefix = ""): { whereSql: string; params: any[] } {
    const p = tablePrefix ? `${tablePrefix}.` : "";
    if (partnerId) {
      return {
        whereSql: `(${p}user_id = ? OR ${p}partner_id = ? OR (${p}user_id = ? AND ${p}partner_id = ?))`,
        params: [userId, userId, partnerId, userId],
      };
    }
    return {
      whereSql: `(${p}user_id = ?)`,
      params: [userId],
    };
  }

  // ==========================================
  // Settings (Initial Balance)
  // ==========================================
  async getSettings(userId: string, partnerId: string | null): Promise<FinanceSettings> {
    const { whereSql, params } = this.coupleFilter(userId, partnerId);
    const rows = await executeQuery<any>(
      `SELECT * FROM finance_settings WHERE ${whereSql} LIMIT 1`,
      params
    );

    if (rows.length === 0) {
      // Create default settings if not exist
      const newSettings: FinanceSettings = {
        id: uuidv4(),
        user_id: userId,
        partner_id: partnerId,
        initial_balance: 0,
      };
      await executeQuery(
        `INSERT INTO finance_settings (id, user_id, partner_id, initial_balance) VALUES (?, ?, ?, ?)`,
        [newSettings.id, newSettings.user_id, newSettings.partner_id, 0]
      );
      return newSettings;
    }

    return {
      id: rows[0].id,
      user_id: rows[0].user_id,
      partner_id: rows[0].partner_id,
      initial_balance: Number(rows[0].initial_balance),
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
    };
  }

  async updateSettings(userId: string, partnerId: string | null, initialBalance: number): Promise<FinanceSettings> {
    const existing = await this.getSettings(userId, partnerId);
    await executeQuery(
      `UPDATE finance_settings SET initial_balance = ? WHERE id = ?`,
      [initialBalance, existing.id]
    );
    existing.initial_balance = initialBalance;
    return existing;
  }

  // ==========================================
  // Categories
  // ==========================================
  async getCategories(userId: string, partnerId: string | null): Promise<FinanceCategory[]> {
    let whereSql = `(is_system = 1 OR user_id = ?)`;
    let params: any[] = [userId];

    if (partnerId) {
      whereSql = `(is_system = 1 OR user_id = ? OR partner_id = ? OR user_id = ?)`;
      params = [userId, userId, partnerId];
    }

    const rows = await executeQuery<any>(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM finance_transactions t WHERE t.category_id = c.id) as transaction_count
       FROM finance_categories c
       WHERE ${whereSql}
       ORDER BY c.is_system DESC, c.name ASC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      partner_id: r.partner_id,
      name: r.name,
      type: r.type,
      icon: r.icon,
      color: r.color,
      is_system: Boolean(r.is_system),
      created_at: r.created_at,
      transaction_count: Number(r.transaction_count || 0),
    }));
  }

  async getCategoryById(id: string): Promise<FinanceCategory | null> {
    const rows = await executeQuery<any>(
      `SELECT * FROM finance_categories WHERE id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      user_id: r.user_id,
      partner_id: r.partner_id,
      name: r.name,
      type: r.type,
      icon: r.icon,
      color: r.color,
      is_system: Boolean(r.is_system),
      created_at: r.created_at,
    };
  }

  async createCategory(cat: FinanceCategory): Promise<FinanceCategory> {
    await executeQuery(
      `INSERT INTO finance_categories (id, user_id, partner_id, name, type, icon, color, is_system)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [cat.id, cat.user_id, cat.partner_id || null, cat.name, cat.type, cat.icon, cat.color]
    );
    return cat;
  }

  async updateCategory(id: string, data: Partial<FinanceCategory>): Promise<FinanceCategory | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.icon !== undefined) {
      fields.push("icon = ?");
      values.push(data.icon);
    }
    if (data.color !== undefined) {
      fields.push("color = ?");
      values.push(data.color);
    }

    if (fields.length === 0) return this.getCategoryById(id);

    values.push(id);
    await executeQuery(
      `UPDATE finance_categories SET ${fields.join(", ")} WHERE id = ? AND is_system = 0`,
      values
    );
    return this.getCategoryById(id);
  }

  async getTransactionCountByCategory(categoryId: string): Promise<number> {
    const rows = await executeQuery<any>(
      `SELECT COUNT(*) as total FROM finance_transactions WHERE category_id = ?`,
      [categoryId]
    );
    return Number(rows[0]?.total || 0);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await executeQuery(`DELETE FROM finance_budgets WHERE category_id = ?`, [categoryId]);
    await executeQuery(`DELETE FROM finance_categories WHERE id = ? AND is_system = 0`, [categoryId]);
  }

  async deleteCategoryWithReassign(categoryId: string, replacementId: string): Promise<void> {
    // 1. Reassign all transactions from categoryId to replacementId
    await executeQuery(
      `UPDATE finance_transactions SET category_id = ? WHERE category_id = ?`,
      [replacementId, categoryId]
    );

    // 2. Delete budgets for this category
    await executeQuery(
      `DELETE FROM finance_budgets WHERE category_id = ?`,
      [categoryId]
    );

    // 3. Delete category
    await executeQuery(
      `DELETE FROM finance_categories WHERE id = ? AND is_system = 0`,
      [categoryId]
    );
  }

  // ==========================================
  // Transactions
  // ==========================================
  async getTransactions(
    userId: string,
    partnerId: string | null,
    filter: {
      type?: "income" | "expense";
      category_id?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      limit?: number;
      page?: number;
    }
  ): Promise<{ transactions: FinanceTransaction[]; total: number }> {
    const { whereSql: coupleWhere, params: coupleParams } = this.coupleFilter(userId, partnerId, "t");
    let conditions = [coupleWhere];
    let params: any[] = [...coupleParams];

    if (filter.type) {
      conditions.push(`t.type = ?`);
      params.push(filter.type);
    }
    if (filter.category_id) {
      conditions.push(`t.category_id = ?`);
      params.push(filter.category_id);
    }
    if (filter.startDate) {
      conditions.push(`t.date >= ?`);
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push(`t.date <= ?`);
      params.push(filter.endDate);
    }
    if (filter.search) {
      conditions.push(`(t.description LIKE ? OR t.notes LIKE ?)`);
      params.push(`%${filter.search}%`, `%${filter.search}%`);
    }

    const whereClause = conditions.join(" AND ");

    // Total count query
    const countRows = await executeQuery<any>(
      `SELECT COUNT(*) as total FROM finance_transactions t WHERE ${whereClause}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const limit = filter.limit || 50;
    const page = filter.page || 1;
    const offset = (page - 1) * limit;

    const rows = await executeQuery<any>(
      `SELECT t.*, 
        c.name as cat_name, c.icon as cat_icon, c.color as cat_color, c.type as cat_type,
        u.name as creator_name
       FROM finance_transactions t
       LEFT JOIN finance_categories c ON t.category_id = c.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE ${whereClause}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    const transactions: FinanceTransaction[] = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      partner_id: r.partner_id,
      category_id: r.category_id,
      type: r.type,
      amount: Number(r.amount),
      description: r.description,
      date: typeof r.date === "string" ? r.date.substring(0, 10) : new Date(r.date).toISOString().substring(0, 10),
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
      creator_name: r.creator_name || undefined,
      category: r.category_id
        ? {
            id: r.category_id,
            user_id: "",
            name: r.cat_name || "Lainnya",
            type: r.cat_type || r.type,
            icon: r.cat_icon || "Tag",
            color: r.cat_color || "#38B2AC",
          }
        : undefined,
    }));

    return { transactions, total };
  }

  async getTransactionById(id: string): Promise<FinanceTransaction | null> {
    const rows = await executeQuery<any>(
      `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color
       FROM finance_transactions t
       LEFT JOIN finance_categories c ON t.category_id = c.id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      user_id: r.user_id,
      partner_id: r.partner_id,
      category_id: r.category_id,
      type: r.type,
      amount: Number(r.amount),
      description: r.description,
      date: typeof r.date === "string" ? r.date.substring(0, 10) : new Date(r.date).toISOString().substring(0, 10),
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
      category: {
        id: r.category_id,
        user_id: "",
        name: r.cat_name || "Lainnya",
        type: r.type,
        icon: r.cat_icon || "Tag",
        color: r.cat_color || "#38B2AC",
      },
    };
  }

  async createTransaction(tx: FinanceTransaction): Promise<FinanceTransaction> {
    await executeQuery(
      `INSERT INTO finance_transactions (id, user_id, partner_id, category_id, type, amount, description, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tx.id, tx.user_id, tx.partner_id || null, tx.category_id, tx.type, tx.amount, tx.description, tx.date, tx.notes || null]
    );
    return tx;
  }

  async updateTransaction(id: string, data: Partial<FinanceTransaction>): Promise<FinanceTransaction | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.type !== undefined) {
      fields.push("type = ?");
      values.push(data.type);
    }
    if (data.amount !== undefined) {
      fields.push("amount = ?");
      values.push(data.amount);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    if (data.date !== undefined) {
      fields.push("date = ?");
      values.push(data.date);
    }
    if (data.category_id !== undefined) {
      fields.push("category_id = ?");
      values.push(data.category_id);
    }
    if (data.notes !== undefined) {
      fields.push("notes = ?");
      values.push(data.notes);
    }

    if (fields.length === 0) return this.getTransactionById(id);

    values.push(id);
    await executeQuery(`UPDATE finance_transactions SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getTransactionById(id);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    await executeQuery(`DELETE FROM finance_transactions WHERE id = ?`, [id]);
    return true;
  }

  // ==========================================
  // Budgets
  // ==========================================
  async getBudgets(userId: string, partnerId: string | null, monthYear: string): Promise<FinanceBudget[]> {
    const { whereSql: bWhere, params: bParams } = this.coupleFilter(userId, partnerId, "b");
    const { whereSql: tWhere, params: tParams } = this.coupleFilter(userId, partnerId, "t");
    const rows = await executeQuery<any>(
      `SELECT b.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM finance_transactions t 
         WHERE t.category_id = b.category_id 
           AND t.type = 'expense'
           AND DATE_FORMAT(t.date, '%Y-%m') = b.month_year
           AND ${tWhere}
        ) as spent
       FROM finance_budgets b
       JOIN finance_categories c ON b.category_id = c.id
       WHERE ${bWhere}
         AND b.month_year = ?
       ORDER BY b.amount DESC`,
      [...tParams, ...bParams, monthYear]
    );

    return rows.map((r) => {
      const amount = Number(r.amount);
      const spent = Number(r.spent || 0);
      const remaining = Math.max(0, amount - spent);
      const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
      let status: "safe" | "warning" | "danger" = "safe";
      if (percentage > 100) status = "danger";
      else if (percentage >= 75) status = "warning";

      return {
        id: r.id,
        user_id: r.user_id,
        partner_id: r.partner_id,
        category_id: r.category_id,
        amount,
        period: r.period,
        month_year: r.month_year,
        created_at: r.created_at,
        updated_at: r.updated_at,
        category: {
          id: r.category_id,
          user_id: "",
          name: r.cat_name,
          type: "expense",
          icon: r.cat_icon,
          color: r.cat_color,
        },
        spent,
        remaining,
        percentage,
        status,
      };
    });
  }

  async createBudget(budget: FinanceBudget): Promise<FinanceBudget> {
    await executeQuery(
      `INSERT INTO finance_budgets (id, user_id, partner_id, category_id, amount, period, month_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), period = VALUES(period)`,
      [budget.id, budget.user_id, budget.partner_id || null, budget.category_id, budget.amount, budget.period, budget.month_year]
    );
    return budget;
  }

  async updateBudget(id: string, amount: number): Promise<FinanceBudget | null> {
    await executeQuery(`UPDATE finance_budgets SET amount = ? WHERE id = ?`, [amount, id]);
    const rows = await executeQuery<any>(`SELECT * FROM finance_budgets WHERE id = ?`, [id]);
    if (rows.length === 0) return null;
    return rows[0] as FinanceBudget;
  }

  async deleteBudget(id: string): Promise<boolean> {
    await executeQuery(`DELETE FROM finance_budgets WHERE id = ?`, [id]);
    return true;
  }

  // ==========================================
  // Assets & Liabilities
  // ==========================================
  async getAssets(userId: string, partnerId: string | null): Promise<FinanceAsset[]> {
    const { whereSql, params } = this.coupleFilter(userId, partnerId);
    const rows = await executeQuery<any>(
      `SELECT * FROM finance_assets WHERE ${whereSql} ORDER BY amount DESC`,
      params
    );
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      partner_id: r.partner_id,
      name: r.name,
      category: r.category,
      amount: Number(r.amount),
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async createAsset(asset: FinanceAsset): Promise<FinanceAsset> {
    await executeQuery(
      `INSERT INTO finance_assets (id, user_id, partner_id, name, category, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [asset.id, asset.user_id, asset.partner_id || null, asset.name, asset.category, asset.amount, asset.notes || null]
    );
    return asset;
  }

  async updateAsset(id: string, data: Partial<FinanceAsset>): Promise<FinanceAsset | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
    if (data.amount !== undefined) { fields.push("amount = ?"); values.push(data.amount); }
    if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes); }

    if (fields.length === 0) return null;
    values.push(id);
    await executeQuery(`UPDATE finance_assets SET ${fields.join(", ")} WHERE id = ?`, values);
    const rows = await executeQuery<any>(`SELECT * FROM finance_assets WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async deleteAsset(id: string): Promise<boolean> {
    await executeQuery(`DELETE FROM finance_assets WHERE id = ?`, [id]);
    return true;
  }

  async getLiabilities(userId: string, partnerId: string | null): Promise<FinanceLiability[]> {
    const { whereSql, params } = this.coupleFilter(userId, partnerId);
    const rows = await executeQuery<any>(
      `SELECT * FROM finance_liabilities WHERE ${whereSql} ORDER BY amount DESC`,
      params
    );
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      partner_id: r.partner_id,
      name: r.name,
      category: r.category,
      amount: Number(r.amount),
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async createLiability(liability: FinanceLiability): Promise<FinanceLiability> {
    await executeQuery(
      `INSERT INTO finance_liabilities (id, user_id, partner_id, name, category, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [liability.id, liability.user_id, liability.partner_id || null, liability.name, liability.category, liability.amount, liability.notes || null]
    );
    return liability;
  }

  async updateLiability(id: string, data: Partial<FinanceLiability>): Promise<FinanceLiability | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
    if (data.amount !== undefined) { fields.push("amount = ?"); values.push(data.amount); }
    if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes); }

    if (fields.length === 0) return null;
    values.push(id);
    await executeQuery(`UPDATE finance_liabilities SET ${fields.join(", ")} WHERE id = ?`, values);
    const rows = await executeQuery<any>(`SELECT * FROM finance_liabilities WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async deleteLiability(id: string): Promise<boolean> {
    await executeQuery(`DELETE FROM finance_liabilities WHERE id = ?`, [id]);
    return true;
  }

  // ==========================================
  // Overview & Reports
  // ==========================================
  async getOverview(userId: string, partnerId: string | null): Promise<FinanceOverview> {
    const { whereSql, params } = this.coupleFilter(userId, partnerId);
    const settings = await this.getSettings(userId, partnerId);

    // 1. All-time income & expense for current balance
    const allTotals = await executeQuery<any>(
      `SELECT type, SUM(amount) as total 
       FROM finance_transactions 
       WHERE ${whereSql} 
       GROUP BY type`,
      params
    );

    let allIncome = 0;
    let allExpense = 0;
    for (const row of allTotals) {
      if (row.type === "income") allIncome = Number(row.total);
      if (row.type === "expense") allExpense = Number(row.total);
    }

    const currentBalance = settings.initial_balance + allIncome - allExpense;

    // 2. This month income & expense
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthTotals = await executeQuery<any>(
      `SELECT type, SUM(amount) as total 
       FROM finance_transactions 
       WHERE ${whereSql} AND DATE_FORMAT(date, '%Y-%m') = ?
       GROUP BY type`,
      [...params, currentMonth]
    );

    let monthIncome = 0;
    let monthExpense = 0;
    for (const row of monthTotals) {
      if (row.type === "income") monthIncome = Number(row.total);
      if (row.type === "expense") monthExpense = Number(row.total);
    }
    const netCashFlowThisMonth = monthIncome - monthExpense;

    // 3. Total manual assets & liabilities
    const assetSum = await executeQuery<any>(
      `SELECT SUM(amount) as total FROM finance_assets WHERE ${whereSql}`,
      params
    );
    const liabilitySum = await executeQuery<any>(
      `SELECT SUM(amount) as total FROM finance_liabilities WHERE ${whereSql}`,
      params
    );
    const manualAssets = Number(assetSum[0]?.total || 0);
    const totalLiabilities = Number(liabilitySum[0]?.total || 0);
    const totalAssets = currentBalance + manualAssets; // Liquid cash + manual assets
    const netWorth = totalAssets - totalLiabilities;

    // 4. Budget progress for this month
    const budgets = await this.getBudgets(userId, partnerId, currentMonth);
    const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
    const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
    const percentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // 5. Recent 5 transactions
    const { transactions: recent } = await this.getTransactions(userId, partnerId, { limit: 5 });

    return {
      current_balance: currentBalance,
      initial_balance: settings.initial_balance,
      total_income_this_month: monthIncome,
      total_expense_this_month: monthExpense,
      net_cash_flow_this_month: netCashFlowThisMonth,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_worth: netWorth,
      budget_progress: {
        total_budget: totalBudget,
        total_spent: totalSpent,
        percentage,
      },
      recent_transactions: recent,
    };
  }

  async getReports(
    userId: string,
    partnerId: string | null,
    startDate: string,
    endDate: string
  ): Promise<FinanceReport> {
    const { whereSql, params } = this.coupleFilter(userId, partnerId);

    // 1. Total income & expense in period
    const totals = await executeQuery<any>(
      `SELECT type, SUM(amount) as total 
       FROM finance_transactions 
       WHERE ${whereSql} AND date >= ? AND date <= ?
       GROUP BY type`,
      [...params, startDate, endDate]
    );

    let totalIncome = 0;
    let totalExpense = 0;
    for (const r of totals) {
      if (r.type === "income") totalIncome = Number(r.total);
      if (r.type === "expense") totalExpense = Number(r.total);
    }
    const netCashFlow = totalIncome - totalExpense;

    // Days count
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const days = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const averageDailyExpense = Math.round(totalExpense / days);

    // 2. Expense by category
    const { whereSql: tWhereSql, params: tParams } = this.coupleFilter(userId, partnerId, "t");
    const expenseCats = await executeQuery<any>(
      `SELECT c.id as category_id, c.name as category_name, c.icon, c.color, SUM(t.amount) as amount
       FROM finance_transactions t
       JOIN finance_categories c ON t.category_id = c.id
       WHERE ${tWhereSql} AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY amount DESC`,
      [...tParams, startDate, endDate]
    );

    const expenseByCategory = expenseCats.map((r) => {
      const amount = Number(r.amount);
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        category_id: r.category_id,
        category_name: r.category_name,
        icon: r.icon,
        color: r.color,
        amount,
        percentage,
      };
    });

    // 3. Income by category
    const incomeCats = await executeQuery<any>(
      `SELECT c.id as category_id, c.name as category_name, c.icon, c.color, SUM(t.amount) as amount
       FROM finance_transactions t
       JOIN finance_categories c ON t.category_id = c.id
       WHERE ${tWhereSql} AND t.type = 'income' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY amount DESC`,
      [...tParams, startDate, endDate]
    );

    const incomeByCategory = incomeCats.map((r) => {
      const amount = Number(r.amount);
      const percentage = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0;
      return {
        category_id: r.category_id,
        category_name: r.category_name,
        icon: r.icon,
        color: r.color,
        amount,
        percentage,
      };
    });

    // 4. Cash flow trend by date
    const trendRows = await executeQuery<any>(
      `SELECT date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
       FROM finance_transactions
       WHERE ${whereSql} AND date >= ? AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [...params, startDate, endDate]
    );

    const cashFlowTrend = trendRows.map((r) => {
      const dateStr = typeof r.date === "string" ? r.date.substring(0, 10) : new Date(r.date).toISOString().substring(0, 10);
      const income = Number(r.income);
      const expense = Number(r.expense);
      return {
        date: dateStr,
        income,
        expense,
        net: income - expense,
      };
    });

    return {
      period: { start_date: startDate, end_date: endDate },
      total_income: totalIncome,
      total_expense: totalExpense,
      net_cash_flow: netCashFlow,
      average_daily_expense: averageDailyExpense,
      expense_by_category: expenseByCategory,
      income_by_category: incomeByCategory,
      cash_flow_trend: cashFlowTrend,
    };
  }
}

export const financeRepo = new FinanceRepository();
