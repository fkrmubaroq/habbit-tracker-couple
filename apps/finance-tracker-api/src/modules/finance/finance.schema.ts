import { z } from "zod";

export * from "@repo/types";

export const transactionQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category_id: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  page: z.coerce.number().min(1).default(1),
});

export const reportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const budgetQuerySchema = z.object({
  month_year: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});
