import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { financeRepo } from "./finance.repository.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  createBudgetSchema,
  updateBudgetSchema,
  budgetQuerySchema,
  createAssetSchema,
  updateAssetSchema,
  createLiabilitySchema,
  updateLiabilitySchema,
  updateSettingsSchema,
  reportQuerySchema,
} from "./finance.schema.js";

export class FinanceController {
  // ==========================================
  // Overview
  // ==========================================
  async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = await financeRepo.getOverview(req.userId!, req.partnerId || null);
      return res.json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Settings
  // ==========================================
  async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await financeRepo.getSettings(req.userId!, req.partnerId || null);
      return res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = updateSettingsSchema.parse(req.body);
      const settings = await financeRepo.updateSettings(
        req.userId!,
        req.partnerId || null,
        parsed.initial_balance
      );
      return res.json({ success: true, data: settings, message: "Saldo awal berhasil diperbarui" });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Categories
  // ==========================================
  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await financeRepo.getCategories(req.userId!, req.partnerId || null);
      return res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createCategorySchema.parse(req.body);
      const newCat = await financeRepo.createCategory({
        id: uuidv4(),
        user_id: req.userId!,
        partner_id: req.partnerId || null,
        name: parsed.name,
        type: parsed.type,
        icon: parsed.icon,
        color: parsed.color,
      });
      return res.status(201).json({ success: true, data: newCat, message: "Kategori berhasil dibuat" });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateCategorySchema.parse(req.body);
      const updated = await financeRepo.updateCategory(id, parsed);
      return res.json({ success: true, data: updated, message: "Kategori berhasil diubah" });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const replacementId =
        req.body?.replacement_id ||
        req.body?.replacementCategoryId ||
        req.query?.replacement_id ||
        req.query?.replacementCategoryId;

      const txCount = await financeRepo.getTransactionCountByCategory(id);

      if (txCount > 0 && !replacementId) {
        return res.status(400).json({
          success: false,
          hasTransactions: true,
          count: txCount,
          error: "Kategori memiliki transaksi. Pilih kategori pengganti untuk mengalihkan transaksi sebelum menghapus.",
        });
      }

      if (replacementId) {
        if (id === String(replacementId)) {
          return res.status(400).json({
            success: false,
            error: "Kategori pengganti tidak boleh sama dengan kategori yang dihapus",
          });
        }
        await financeRepo.deleteCategoryWithReassign(id, String(replacementId));
      } else {
        await financeRepo.deleteCategory(id);
      }

      return res.json({
        success: true,
        message: "Kategori berhasil dihapus dan transaksi telah dialihkan",
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Transactions
  // ==========================================
  async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = transactionQuerySchema.parse(req.query);
      const result = await financeRepo.getTransactions(req.userId!, req.partnerId || null, query);
      return res.json({
        success: true,
        data: result.transactions,
        meta: {
          total: result.total,
          page: query.page,
          limit: query.limit,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getTransactionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tx = await financeRepo.getTransactionById(id);
      if (!tx) {
        return res.status(404).json({ success: false, error: "Transaksi tidak ditemukan" });
      }
      return res.json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  }

  async createTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createTransactionSchema.parse(req.body);
      const newTx = await financeRepo.createTransaction({
        id: uuidv4(),
        user_id: req.userId!,
        partner_id: req.partnerId || null,
        category_id: parsed.category_id,
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        date: parsed.date,
        notes: parsed.notes || null,
      });
      return res.status(201).json({ success: true, data: newTx, message: "Transaksi berhasil dicatat" });
    } catch (err) {
      next(err);
    }
  }

  async updateTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateTransactionSchema.parse(req.body);
      const updated = await financeRepo.updateTransaction(id, parsed);
      return res.json({ success: true, data: updated, message: "Transaksi berhasil diubah" });
    } catch (err) {
      next(err);
    }
  }

  async deleteTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await financeRepo.deleteTransaction(id);
      return res.json({ success: true, message: "Transaksi berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Budgets
  // ==========================================
  async getBudgets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = budgetQuerySchema.parse(req.query);
      const currentMonth = query.month_year || new Date().toISOString().substring(0, 7);
      const budgets = await financeRepo.getBudgets(req.userId!, req.partnerId || null, currentMonth);
      return res.json({ success: true, data: budgets });
    } catch (err) {
      next(err);
    }
  }

  async createBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createBudgetSchema.parse(req.body);
      const newBudget = await financeRepo.createBudget({
        id: uuidv4(),
        user_id: req.userId!,
        partner_id: req.partnerId || null,
        category_id: parsed.category_id,
        amount: parsed.amount,
        period: parsed.period,
        month_year: parsed.month_year,
      });
      return res.status(201).json({ success: true, data: newBudget, message: "Anggaran berhasil disimpan" });
    } catch (err) {
      next(err);
    }
  }

  async updateBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateBudgetSchema.parse(req.body);
      const updated = await financeRepo.updateBudget(id, parsed.amount);
      return res.json({ success: true, data: updated, message: "Anggaran berhasil diperbarui" });
    } catch (err) {
      next(err);
    }
  }

  async deleteBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await financeRepo.deleteBudget(id);
      return res.json({ success: true, message: "Anggaran berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Reports
  // ==========================================
  async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = reportQuerySchema.parse(req.query);
      const report = await financeRepo.getReports(
        req.userId!,
        req.partnerId || null,
        query.startDate,
        query.endDate
      );
      return res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Assets & Liabilities (Net Worth)
  // ==========================================
  async getNetWorth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = await financeRepo.getOverview(req.userId!, req.partnerId || null);
      const assets = await financeRepo.getAssets(req.userId!, req.partnerId || null);
      const liabilities = await financeRepo.getLiabilities(req.userId!, req.partnerId || null);

      return res.json({
        success: true,
        data: {
          current_balance: overview.current_balance,
          liquid_cash: overview.current_balance,
          manual_assets_total: overview.total_assets - overview.current_balance,
          total_assets: overview.total_assets,
          total_liabilities: overview.total_liabilities,
          net_worth: overview.net_worth,
          assets,
          liabilities,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAssets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const assets = await financeRepo.getAssets(req.userId!, req.partnerId || null);
      return res.json({ success: true, data: assets });
    } catch (err) {
      next(err);
    }
  }

  async createAsset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createAssetSchema.parse(req.body);
      const asset = await financeRepo.createAsset({
        id: uuidv4(),
        user_id: req.userId!,
        partner_id: req.partnerId || null,
        name: parsed.name,
        category: parsed.category,
        amount: parsed.amount,
        notes: parsed.notes || null,
      });
      return res.status(201).json({ success: true, data: asset, message: "Aset berhasil ditambahkan" });
    } catch (err) {
      next(err);
    }
  }

  async updateAsset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateAssetSchema.parse(req.body);
      const updated = await financeRepo.updateAsset(id, parsed);
      return res.json({ success: true, data: updated, message: "Aset berhasil diperbarui" });
    } catch (err) {
      next(err);
    }
  }

  async deleteAsset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await financeRepo.deleteAsset(id);
      return res.json({ success: true, message: "Aset berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  }

  async getLiabilities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const liabilities = await financeRepo.getLiabilities(req.userId!, req.partnerId || null);
      return res.json({ success: true, data: liabilities });
    } catch (err) {
      next(err);
    }
  }

  async createLiability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createLiabilitySchema.parse(req.body);
      const liability = await financeRepo.createLiability({
        id: uuidv4(),
        user_id: req.userId!,
        partner_id: req.partnerId || null,
        name: parsed.name,
        category: parsed.category,
        amount: parsed.amount,
        notes: parsed.notes || null,
      });
      return res.status(201).json({ success: true, data: liability, message: "Liabilitas berhasil ditambahkan" });
    } catch (err) {
      next(err);
    }
  }

  async updateLiability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateLiabilitySchema.parse(req.body);
      const updated = await financeRepo.updateLiability(id, parsed);
      return res.json({ success: true, data: updated, message: "Liabilitas berhasil diperbarui" });
    } catch (err) {
      next(err);
    }
  }

  async deleteLiability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await financeRepo.deleteLiability(id);
      return res.json({ success: true, message: "Liabilitas berhasil dihapus" });
    } catch (err) {
      next(err);
    }
  }
}

export const financeController = new FinanceController();
