// @/schemas/item.ts

import { z } from "zod";
import { idSchema } from "./id";

export const itemSchema = z.object({
  id: idSchema.optional(), // UUID
  // This value is assigned by the database and cannot be empty
  createdAt: z.date().optional().default(new Date(0)),
  // This value is assigned by the database and cannot be empty
  lastModified: z.date().optional().default(new Date(0)),
  parentId: idSchema,
});

export type ItemInputType = z.input<typeof itemSchema>;
export type ItemOutputType = z.output<typeof itemSchema>;
