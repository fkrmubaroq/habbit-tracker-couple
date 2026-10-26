import { z } from "zod";

const isoDateTime = z
  .string()
  .min(1, "Tanggal wajib diisi")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Format tanggal tidak valid");

export const updateSettingsSchema = z.object({
  body: z.object({
    focus_minutes: z.number().int().min(1).max(180).optional(),
    short_break_minutes: z.number().int().min(1).max(60).optional(),
    long_break_minutes: z.number().int().min(1).max(120).optional(),
    long_break_interval: z.number().int().min(1).max(12).optional(),
    auto_start_break: z.boolean().optional(),
  }),
});

export const createSessionSchema = z.object({
  body: z
    .object({
      id: z.string().uuid("ID sesi harus berupa UUID"),
      label: z.string().max(80, "Label maksimal 80 karakter").optional().nullable(),
      planned_minutes: z.number().int().min(1).max(180),
      actual_minutes: z.number().int().min(1).max(180),
      started_at: isoDateTime,
      ended_at: isoDateTime,
    })
    .refine((data) => Date.parse(data.ended_at) > Date.parse(data.started_at), {
      message: "ended_at harus setelah started_at",
      path: ["ended_at"],
    }),
});

export const listSessionsQuerySchema = z.object({
  query: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }),
});

export const statsQuerySchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});
