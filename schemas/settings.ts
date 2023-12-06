// schemas/settingsSchema.ts
import * as z from "zod";

export const settingsSchema = z.object({
  allowDeleteAllItems: z.boolean(),
  showParentItemListInternals: z.boolean(),
  showParentItemIdentifiers: z.boolean(),
  impersonatingUserAuthProviderId: z.string().uuid().nullable(),
});

export type SettingsFormType = z.infer<typeof settingsSchema>;
