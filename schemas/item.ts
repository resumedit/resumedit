// @/schemas/item.ts

import { z } from "zod";
import { idSchema } from "./id";

const itemFormSchema = z.object({});

const itemDisplaySchema = z.object({
  createdAt: z.date().optional().default(new Date(0)),
  lastModified: z.date().optional().default(new Date(0)),
  parentId: idSchema,
});

const itemInternalSchema = z.object({
  id: idSchema.optional(), // UUID
  // This value is assigned by the database and cannot be empty
  createdAt: z.date().optional().default(new Date(0)),
  // This value is assigned by the database and cannot be empty
  lastModified: z.date().optional().default(new Date(0)),
  parentId: idSchema,
});

export const itemSchema = {
  form: itemFormSchema,
  display: itemDisplaySchema,
  internal: itemInternalSchema,
  store: itemInternalSchema.merge(itemFormSchema),
};

export type ItemInputType = z.input<typeof itemSchema.store>;
export type ItemOutputType = z.output<typeof itemSchema.store>;
