import { z } from "zod";

export const toggleLogSchema = z.object({
  body: z.object({
    habit_id: z.string().uuid("Invalid habit ID"),
    completed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    is_completed: z.boolean(),
    notes: z.string().nullable().optional(),
  }),
});

export const getLogsSchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format"),
  }),
});
