// @/schemas/role.ts

import { z } from "zod";
import { itemClientStateSchema, itemSchema } from "./item";

export const roleFormSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().default(""),
});

export const roleSchema = {
  form: roleFormSchema,
  display: roleFormSchema,
  internal: roleFormSchema,
  persistServer: itemSchema.persistServer.merge(roleFormSchema),
};

export type RoleInputType = z.input<typeof roleSchema.persistServer>;
export type RoleOutputType = z.output<typeof roleSchema.persistServer>;

export const roleItemClientStateSchema = itemClientStateSchema.merge(roleFormSchema);
export type RoleItemClientStateType = z.input<typeof roleItemClientStateSchema>;
