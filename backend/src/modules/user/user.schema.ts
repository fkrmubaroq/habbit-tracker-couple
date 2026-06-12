import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").max(100),
    avatar_emoji: z.string().min(1, "Avatar emoji is required"),
    avatar_image: z.string().nullable().optional(),
    theme_preferences: z.object({
      theme: z.string(),
    }).nullable().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").or(z.literal("")).optional(),
  }),
});
