// @/schemas/role.ts

import { z } from "zod";
import { itemSchema } from "./item";

export const roleItemSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().default(""),
});

export const roleSchema = itemSchema.merge(roleItemSchema);

export type RoleInputType = z.input<typeof roleSchema>;
export type RoleOutputType = z.output<typeof roleSchema>;
