import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { groceryRepo, userRepo } from "../../repositories/repository.factory.js";
import { GroceryItem } from "../../types/index.js";

export async function getGroceryItems(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const user = await userRepo.findById(userId);
    const partnerId = user?.partner_id || null;

    const items = await groceryRepo.findForCouple(userId, partnerId);
    return res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function createGroceryItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const user = await userRepo.findById(userId);
    const partnerId = user?.partner_id || null;

    const { name, category, quantity, unit, estimated_price, is_urgent } = req.body;

    const newItem: GroceryItem = {
      id: uuidv4(),
      user_id: userId,
      partner_id: partnerId,
      name,
      category: category || "Lainnya",
      quantity: quantity || "1",
      unit: unit || null,
      estimated_price: estimated_price ? Number(estimated_price) : null,
      is_urgent: Boolean(is_urgent),
      is_completed: false,
    };

    const item = await groceryRepo.create(newItem);
    return res.status(201).json({ message: "Item belanjaan berhasil ditambahkan", item });
  } catch (err) {
    next(err);
  }
}

export async function updateGroceryItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const existing = await groceryRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Item belanjaan tidak ditemukan" });
    }

    const { name, category, quantity, unit, estimated_price, is_urgent } = req.body;

    const updatedItem: GroceryItem = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      category: category !== undefined ? category : existing.category,
      quantity: quantity !== undefined ? quantity : existing.quantity,
      unit: unit !== undefined ? unit : existing.unit,
      estimated_price: estimated_price !== undefined ? (estimated_price ? Number(estimated_price) : null) : existing.estimated_price,
      is_urgent: is_urgent !== undefined ? Boolean(is_urgent) : existing.is_urgent,
    };

    const item = await groceryRepo.update(updatedItem);
    return res.json({ message: "Item belanjaan berhasil diperbarui", item });
  } catch (err) {
    next(err);
  }
}

export async function toggleGroceryItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { is_completed } = req.body;

    const existing = await groceryRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Item belanjaan tidak ditemukan" });
    }

    const item = await groceryRepo.toggleComplete(id, Boolean(is_completed), userId);
    return res.json({ message: "Status item berhasil diubah", item });
  } catch (err) {
    next(err);
  }
}

export async function deleteGroceryItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const existing = await groceryRepo.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Item belanjaan tidak ditemukan" });
    }

    await groceryRepo.delete(id);
    return res.json({ message: "Item belanjaan berhasil dihapus" });
  } catch (err) {
    next(err);
  }
}

export async function clearCompletedGroceryItems(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const user = await userRepo.findById(userId);
    const partnerId = user?.partner_id || null;

    const deletedCount = await groceryRepo.clearCompleted(userId, partnerId);
    return res.json({ message: "Item selesai berhasil dibersihkan", deletedCount });
  } catch (err) {
    next(err);
  }
}
