// @/schemas/item.ts

import { ItemDisposition } from "@/types/item";
import { itemDescendantModelHierarchy } from "@/types/itemDescendant";
import { z } from "zod";
import { idDefault, idSchema } from "./id";

const itemDataSchema = z.object({});

const itemPersistClientSchema = z.object({
  clientId: idSchema,
  parentClientId: idSchema.nullable(),
  disposition: z.nativeEnum(ItemDisposition),
});

const itemPersistServerSchema = z.object({
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
  form: itemDataSchema,
  display: itemDataSchema,
  persistClient: itemDataSchema.merge(itemPersistClientSchema),
  persistServer: itemDataSchema.merge(itemPersistServerSchema),
};

export type ItemInputType = z.input<typeof itemSchema.persistServer>;
export type ItemOutputType = z.output<typeof itemSchema.persistServer>;

export const itemClientStateSchema = itemSchema.persistClient.extend({
  itemModel: z.enum(itemDescendantModelHierarchy),
  descendantModel: z.union([z.enum(itemDescendantModelHierarchy), z.null()]),
});

export const itemServerToClientSchema = itemSchema.persistServer.extend({
  clientId: idSchema.optional(),
  parentClientId: idSchema.optional(),
});
// Type returned by server in response to items received from client to merge with server's state
// export type ItemServerToClientType = ItemOutputType & {
//   clientId?: IdSchemaType;
// };
// Use z.input to derive the ItemServerToClientType type
export type ItemServerToClientType = z.input<typeof itemServerToClientSchema>;

// This is the full-fledged Prisma schema,
// - extended with `itemModel` and `descendantModel` to enable navigating the item model hierarchy
// - extended with `disposition` to make it compatible with `ItemClientStateType`
// export type ItemServerStateType = ItemOutputType & {
//   clientId: IdSchemaType;
//   parentClientId: IdSchemaType;
//   itemModel: ItemDescendantModelNameType;
//   descendantModel: ItemDescendantModelNameType;
//   disposition: ItemDisposition;
// };
export const itemServerStateSchema: z.ZodTypeAny = itemSchema.persistServer.merge(itemClientStateSchema);
export type ItemServerStateType = z.input<typeof itemServerToClientSchema>;
