import { z } from "zod";

export const createGroceryItemSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nama barang wajib diisi").max(255),
    category: z.string().max(100).default("Lainnya"),
    quantity: z.string().max(50).default("1"),
    unit: z.string().max(50).optional().nullable(),
    estimated_price: z.number().nonnegative().optional().nullable(),
    is_urgent: z.boolean().default(false),
  }),
});

export const updateGroceryItemSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID wajib diisi"),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    category: z.string().max(100).optional(),
    quantity: z.string().max(50).optional(),
    unit: z.string().max(50).optional().nullable(),
    estimated_price: z.number().nonnegative().optional().nullable(),
    is_urgent: z.boolean().optional(),
  }),
});

export const toggleGroceryItemSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID wajib diisi"),
  }),
  body: z.object({
    is_completed: z.boolean(),
  }),
});

export const groceryIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID wajib diisi"),
  }),
});
