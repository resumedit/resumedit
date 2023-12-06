import { z } from "zod";
import { itemClientStateSchema, itemSchema } from "./item";

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
  persistServer: itemSchema.persistServer.merge(achievementInternalSchema.merge(achievementFormSchema)),
};

export type AchievementInputType = z.input<typeof achievementSchema.persistServer>;
export type AchievementOutputType = z.output<typeof achievementSchema.persistServer>;

export const achievementItemClientStateSchema = itemClientStateSchema.merge(achievementFormSchema);
export type AchievementItemClientStateType = z.input<typeof achievementItemClientStateSchema>;
