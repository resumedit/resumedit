// @/schemas/itemDescendant.ts

import { ItemDescendantModelNameType, itemDescendantModelHierarchy } from "@/types/itemDescendant";
import { z } from "zod";
import { idSchema } from "./id";
import {
  ItemClientStateType,
  ItemDataUntypedType,
  ItemOrderableClientStateType,
  ItemOrderableServerStateType,
  ItemServerOutputType,
  ItemServerStateType,
  ItemServerToClientType,
  itemClientStateSchema,
  itemOrderableClientStateSchema,
  itemOrderableServerStateSchema,
  itemServerOutputSchema,
  itemServerStateSchema,
  itemServerToClientSchema,
} from "./item";

export type ItemDescendantClientStateListType = Array<ItemDescendantClientStateType>;
export type ItemDescendantClientStateType = ItemClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantClientStateListType;
};
// FIXME: The type cannot be inferred from the Zod schema due to the recursive nature
// export type ItemDescendantClientStateType = z.output<typeof itemDescendantClientStateSchema>;
export const itemDescendantClientStateSchema: z.ZodSchema<ItemDescendantClientStateType> = itemClientStateSchema.extend(
  {
    descendants: z.lazy(() => z.array(itemDescendantClientStateSchema)), // Lazy to handle recursive structure
  },
);

// The store state additionally includes a descendantDraft at the item level
export type ItemDescendantStoreStateListType = Array<ItemDescendantStoreStateType>;
export type ItemDescendantStoreStateType = ItemClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantClientStateListType;
  descendantDraft: ItemDataUntypedType;
};
export const itemDescendantStoreStateSchema: z.ZodSchema<ItemDescendantStoreStateType> = itemClientStateSchema.extend({
  descendants: z.lazy(() => z.array(itemDescendantStoreStateSchema)), // Lazy to handle recursive structure
  descendantDraft: z.record(z.any()),
});

// Type used by client to maintain client state with orderable descendants
export type ItemDescendantOrderableClientStateListType = Array<ItemDescendantOrderableClientStateType>;
export type ItemDescendantOrderableClientStateType = ItemOrderableClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantOrderableClientStateListType;
};
export const itemDescendantOrderableClientStateSchema: z.ZodSchema<ItemDescendantOrderableClientStateType> =
  itemOrderableClientStateSchema.extend({
    descendants: z.lazy(() => z.array(itemDescendantOrderableClientStateSchema)), // Lazy to handle recursive structure
  });

// The store state additionally includes a descendantDraft at the item level
export type ItemDescendantOrderableStoreStateListType = Array<ItemDescendantOrderableStoreStateType>;
export type ItemDescendantOrderableStoreStateType = ItemOrderableClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantOrderableStoreStateListType;
  descendantDraft: ItemDataUntypedType;
};
export const itemDescendantOrderableStoreStateSchema: z.ZodSchema<ItemDescendantOrderableStoreStateType> =
  itemOrderableClientStateSchema.extend({
    descendants: z.lazy(() => z.array(itemDescendantOrderableStoreStateSchema)), // Lazy to handle recursive structure
    descendantDraft: z.record(z.any()),
  });

// Define the ItemDescendantServerOutputType schema
export type ItemDescendantServerOutputListType = Array<ItemDescendantServerOutputType>;
export type ItemDescendantServerOutputType = ItemServerOutputType & {
  descendants: ItemDescendantServerOutputListType;
};
export const itemDescendantServerOutputSchema: z.ZodSchema<ItemDescendantServerOutputType> =
  itemServerOutputSchema.extend({
    id: idSchema, // Need to redefine `id` without a default value as it is always included in server-to-client transmission
    descendants: z.lazy(() => z.array(itemDescendantServerOutputSchema)), // Lazy to handle recursive structure
  });

// Define the ItemDescendantServerToClientType schema
export type ItemDescendantServerToClientListType = Array<ItemDescendantServerToClientType>;
export type ItemDescendantServerToClientType = ItemServerToClientType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantServerToClientListType;
};
export const itemDescendantServerToClientSchema: z.ZodSchema<ItemDescendantServerToClientType> =
  itemServerToClientSchema.extend({
    id: idSchema, // Need to redefine `id` without a default value as it is always included in server-to-client transmission
    itemModel: z.enum(itemDescendantModelHierarchy),
    descendantModel: z.union([z.enum(itemDescendantModelHierarchy), z.null()]),
    descendants: z.lazy(() => z.array(itemDescendantServerToClientSchema)), // Lazy to handle recursive structure
  });

// Type used by server to maintain server state
export type ItemDescendantServerStateListType = Array<ItemDescendantServerStateType>;
export type ItemDescendantServerStateType = ItemServerStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantServerStateListType;
};

export const itemDescendantServerStateSchema: z.ZodSchema<ItemDescendantServerStateType> = itemServerStateSchema.extend(
  {
    id: idSchema, // Need to redefine `id` without a default value as it is always included in server state
    itemModel: z.enum(itemDescendantModelHierarchy),
    descendantModel: z.union([z.enum(itemDescendantModelHierarchy), z.null()]),
    descendants: z.lazy(() => z.array(itemDescendantServerStateSchema)), // Lazy to handle recursive structure
  },
);

// Type used by server to maintain server state of items with orderable descenants
export type ItemDescendantOrderableServerStateListType = Array<ItemDescendantOrderableServerStateType>;
export type ItemDescendantOrderableServerStateType = ItemOrderableServerStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantOrderableServerStateListType;
};

export const itemDescendantOrderableServerStateSchema: z.ZodSchema<ItemDescendantOrderableServerStateType> =
  itemOrderableServerStateSchema.extend({
    id: idSchema, // Need to redefine `id` without a default value as it is always included in server state
    itemModel: z.enum(itemDescendantModelHierarchy),
    descendantModel: z.union([z.enum(itemDescendantModelHierarchy), z.null()]),
    descendants: z.lazy(() => z.array(itemDescendantOrderableServerStateSchema)), // Lazy to handle recursive structure
  });
