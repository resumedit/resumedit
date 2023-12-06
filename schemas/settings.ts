// schemas/settingsSchema.ts
import * as z from "zod";

export const settingsSchema = z.object({
  showParentItemListInternals: z.boolean(),
  showParentItemIdentifiers: z.boolean(),
  showParentItemListSynchronization: z.boolean(),
  // allowDeleteAllItems: z.boolean(),
  // impersonatingUserAuthProviderId: z.string().uuid().nullable(),
});

export type SettingsFormType = z.infer<typeof settingsSchema>;
