// @/schemas/item.ts

import { z } from "zod";
import { idDefault, idSchema } from "./id";

const itemFormSchema = z.object({});

const itemInternalSchema = z.object({
  id: idSchema.optional().default(idDefault), // UUID
  // This value is assigned by the database and cannot be empty
  createdAt: z.date().optional().default(new Date(0)),
  // This value is assigned by the database and cannot be empty
  lastModified: z.date().optional().default(new Date(0)),
  // This value is assigned when the item is deleted and is normally null
  deletedAt: z.date().optional().nullable(),
  parentId: idSchema,
});

export const itemSchema = {
  form: itemFormSchema,
  display: itemFormSchema,
  internal: itemInternalSchema,
  store: itemInternalSchema.merge(itemFormSchema),
};

export type ItemInputType = z.input<typeof itemSchema.store>;
export type ItemOutputType = z.output<typeof itemSchema.store>;
