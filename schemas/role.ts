// @/schemas/role.ts

import { z } from "zod";
import { itemSchema } from "./item";

export const roleFormSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().default(""),
});

export const roleSchema = {
  form: roleFormSchema,
  display: roleFormSchema,
  internal: roleFormSchema,
  store: itemSchema.store.merge(roleFormSchema),
};

export type RoleInputType = z.input<typeof roleSchema.store>;
export type RoleOutputType = z.output<typeof roleSchema.store>;
