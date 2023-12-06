import { z } from "zod";
import { itemSchema } from "./item";

export const achievementFormSchema = z.object({
  content: z.string(),
});

export const achievementInternalSchema = z.object({
  order: z.number(),
});

export const achievementSchema = {
  form: achievementFormSchema,
  display: achievementFormSchema,
  internal: achievementInternalSchema,
  store: itemSchema.store.merge(achievementInternalSchema.merge(achievementFormSchema)),
};

export type AchievementInputType = z.input<typeof achievementSchema.store>;
export type AchievementOutputType = z.output<typeof achievementSchema.store>;
