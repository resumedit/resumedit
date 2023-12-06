// schemas/appSettings.ts
import * as z from "zod";

export const appSettingsSchema = z.object({
  synchronizationInterval: z.number().min(0).max(86400),
  showItemDescendantInternals: z.boolean(),
  showItemDescendantIdentifiers: z.boolean(),
  showItemDescendantSynchronization: z.boolean(),
  // allowDeleteAllItems: z.boolean(),
  // impersonatingUserAuthProviderId: z.string().uuid().nullable(),
  isLoggingEnabled: z.boolean(),
});

export type SettingsFormType = z.infer<typeof appSettingsSchema>;
