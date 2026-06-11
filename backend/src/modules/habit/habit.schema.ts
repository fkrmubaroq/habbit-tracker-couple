import { z } from "zod";

export const createHabitSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().nullable().optional(),
    icon_emoji: z.string().min(1, "Icon emoji is required"),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    is_shared: z.boolean().default(false),
  }),
});

export const updateHabitSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid habit ID"),
  }),
  body: z.object({
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().nullable().optional(),
    icon_emoji: z.string().min(1, "Icon emoji is required"),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    is_shared: z.boolean(),
    is_active: z.boolean(),
  }),
});

export const habitIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid habit ID"),
  }),
});
