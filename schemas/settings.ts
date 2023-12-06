// schemas/settingsSchema.ts
import * as z from "zod";

export const settingsSchema = z.object({
  synchronizationInterval: z.number().min(0).max(86400),
  showItemDescendantInternals: z.boolean(),
  showItemDescendantIdentifiers: z.boolean(),
  showItemDescendantSynchronization: z.boolean(),
  // allowDeleteAllItems: z.boolean(),
  // impersonatingUserAuthProviderId: z.string().uuid().nullable(),
});

export type SettingsFormType = z.infer<typeof settingsSchema>;
