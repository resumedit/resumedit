import { z } from "zod";
import { itemSchema } from "./item";

export const achievementItemSchema = z.object({
  content: z.string(),
  value: z.number(),
  order: z.number(),
});

export const achievementSchema = itemSchema.merge(achievementItemSchema);

export type AchievementOutputType = z.output<typeof achievementSchema>;
export type AchievementInputType = z.input<typeof achievementSchema>;
