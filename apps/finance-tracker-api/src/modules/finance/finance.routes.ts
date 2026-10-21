import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { financeController } from "./finance.controller.js";

const router = Router();

// Protect all finance routes with authMiddleware
router.use(authMiddleware);

// Overview & Settings
router.get("/overview", (req, res, next) => financeController.getOverview(req, res, next));
router.get("/settings", (req, res, next) => financeController.getSettings(req, res, next));
router.put("/settings", (req, res, next) => financeController.updateSettings(req, res, next));

// Categories
router.get("/categories", (req, res, next) => financeController.getCategories(req, res, next));
router.post("/categories", (req, res, next) => financeController.createCategory(req, res, next));
router.put("/categories/:id", (req, res, next) => financeController.updateCategory(req, res, next));
router.delete("/categories/:id", (req, res, next) => financeController.deleteCategory(req, res, next));

// Transactions
router.get("/transactions", (req, res, next) => financeController.getTransactions(req, res, next));
router.get("/transactions/:id", (req, res, next) => financeController.getTransactionById(req, res, next));
router.post("/transactions", (req, res, next) => financeController.createTransaction(req, res, next));
router.put("/transactions/:id", (req, res, next) => financeController.updateTransaction(req, res, next));
router.delete("/transactions/:id", (req, res, next) => financeController.deleteTransaction(req, res, next));

// Budgets
router.get("/budgets", (req, res, next) => financeController.getBudgets(req, res, next));
router.post("/budgets", (req, res, next) => financeController.createBudget(req, res, next));
router.put("/budgets/:id", (req, res, next) => financeController.updateBudget(req, res, next));
router.delete("/budgets/:id", (req, res, next) => financeController.deleteBudget(req, res, next));

// Reports
router.get("/reports", (req, res, next) => financeController.getReports(req, res, next));

// Net Worth & Assets / Liabilities
router.get("/net-worth", (req, res, next) => financeController.getNetWorth(req, res, next));

router.get("/assets", (req, res, next) => financeController.getAssets(req, res, next));
router.post("/assets", (req, res, next) => financeController.createAsset(req, res, next));
router.put("/assets/:id", (req, res, next) => financeController.updateAsset(req, res, next));
router.delete("/assets/:id", (req, res, next) => financeController.deleteAsset(req, res, next));

router.get("/liabilities", (req, res, next) => financeController.getLiabilities(req, res, next));
router.post("/liabilities", (req, res, next) => financeController.createLiability(req, res, next));
router.put("/liabilities/:id", (req, res, next) => financeController.updateLiability(req, res, next));
router.delete("/liabilities/:id", (req, res, next) => financeController.deleteLiability(req, res, next));

export default router;
