import { Response, NextFunction, Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { habitRepo, userRepo } from "../../repositories/repository.factory.js";
import { Habit } from "../../types/index.js";

export async function createHabit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { title, description, icon_emoji, frequency, is_shared } = req.body;

    const newHabit: Habit = {
      id: uuidv4(),
      user_id: userId,
      title,
      description: description || null,
      icon_emoji,
      frequency,
      is_shared,
      is_active: true,
    };

    const habit = await habitRepo.create(newHabit);
    return res.status(201).json({ message: "Habit created successfully", habit });
  } catch (err) {
    next(err);
  }
}

export async function updateHabit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, description, icon_emoji, frequency, is_shared, is_active } = req.body;

    const habit = await habitRepo.findById(id);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }

    if (habit.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized: You do not own this habit" });
    }

    habit.title = title;
    habit.description = description !== undefined ? description : habit.description;
    habit.icon_emoji = icon_emoji;
    habit.frequency = frequency;
    habit.is_shared = is_shared;
    habit.is_active = is_active;

    const updatedHabit = await habitRepo.update(habit);
    return res.json({ message: "Habit updated successfully", habit: updatedHabit });
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const habit = await habitRepo.findById(id);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }

    if (habit.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized: You do not own this habit" });
    }

    await habitRepo.delete(id);
    return res.json({ message: "Habit deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function getMyHabits(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const user = req.user!;
    
    // Get personal habits
    const personalHabits = await habitRepo.findByUserId(userId);

    // Get shared habits (owned by partner but shared)
    let sharedHabits: Habit[] = [];
    if (user.partner_id) {
      sharedHabits = await habitRepo.findShared(user.partner_id, null);
    }

    // Merge list and avoid duplicates if any
    const allHabitsMap = new Map<string, Habit>();
    personalHabits.forEach(h => allHabitsMap.set(h.id, h));
    sharedHabits.forEach(h => allHabitsMap.set(h.id, h));

    return res.json({ habits: Array.from(allHabitsMap.values()) });
  } catch (err) {
    next(err);
  }
}

export async function getPartnerHabits(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;
    if (!user.partner_id) {
      return res.json({ habits: [] });
    }

    const habits = await habitRepo.findByUserId(user.partner_id);
    // Return only active habits. Shared or all? 
    // In a couple app, partner's habits can be visible. We can return all of them or only shared. Let's return all partner habits so they see each other's progress, but mark which ones are shared!
    return res.json({ habits });
  } catch (err) {
    next(err);
  }
}

export function getHabitTemplates(req: Request, res: Response) {
  const templates = [
    { title: "Drink 2L Water", description: "Keep hydrated throughout the day", icon_emoji: "💧", frequency: "daily" },
    { title: "Gym Workout", description: "Resistance training or cardio", icon_emoji: "🏋️‍♂️", frequency: "daily" },
    { title: "Read 10 Pages", description: "Read self-improvement or literature", icon_emoji: "📖", frequency: "daily" },
    { title: "Evening Walk Together", description: "Connect and talk after work", icon_emoji: "🚶‍♂️🚶‍♀️", frequency: "daily" },
    { title: "Weekly Date Night", description: "Dinner or movie night together", icon_emoji: "🌹", frequency: "weekly" },
    { title: "Weekly Budgeting", description: "Check finances and update tracker", icon_emoji: "📊", frequency: "weekly" },
    { title: "Meditate for 10 min", description: "Breathing exercises and mindfulness", icon_emoji: "🧘‍♂️", frequency: "daily" },
    { title: "House Cleaning", description: "Tidy up the living room and kitchen", icon_emoji: "🧹", frequency: "weekly" },
  ];

  return res.json({ templates });
}
