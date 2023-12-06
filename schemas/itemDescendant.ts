// @/schemas/itemDescendant.ts

import { z } from "zod";
import { itemDescendantModelHierarchy } from "@/types/itemDescendant";
import { itemServerToClientSchema } from "./item";

// Define the ItemDescendantServerToClientType schema
// export type ItemDescendantServerToClientType<I, C> = ItemServerToClientType & {
//   itemModel: ItemDescendantModelNameType;
//   descendantModel: ItemDescendantModelNameType | null;
//   descendants: ItemServerToClientDescendantListType<I, C>;
// };
export const itemDescendantServerToClientSchema: z.ZodTypeAny = itemServerToClientSchema.extend({
  itemModel: z.enum(itemDescendantModelHierarchy),
  descendantModel: z.union([z.enum(itemDescendantModelHierarchy), z.null()]),
  descendants: z.lazy(() => z.array(itemDescendantServerToClientSchema)), // Lazy to handle recursive structure
});

// Use z.infer to derive the ItemDescendantServerToClientType type
export type ItemDescendantServerToClientType = z.infer<typeof itemDescendantServerToClientSchema>;

// export type ItemServerToClientDescendantListType<I, C> = Array<ItemDescendantServerToClientType<I, C>>;
// Use z.infer to derive the ItemServerToClientDescendantListType type
export type ItemServerToClientDescendantListType = Array<ItemDescendantServerToClientType>;

// Type used by server to maintain server state
// export type ItemDescendantServerStateType<I, C> = ItemServerStateType & {
//   itemModel: ItemDescendantModelNameType;
//   descendantModel: ItemDescendantModelNameType | null;
//   descendants: ItemServerStateDescendantListType<I, C>;
// };
export const itemDescendantServerStateSchema: z.ZodTypeAny = itemServerToClientSchema.extend({
  itemModel: z.enum(itemDescendantModelHierarchy),
  descendantModel: z.union([z.enum(itemDescendantModelHierarchy), z.null()]),
  descendants: z.lazy(() => z.array(itemDescendantServerStateSchema)), // Lazy to handle recursive structure
});

// Use z.infer to derive the ItemDescendantServerToClientType type
export type ItemDescendantServerStateType = z.infer<typeof itemDescendantServerStateSchema>;

// export type ItemServerStateDescendantListType<I, C> = Array<ItemDescendantServerStateType<I, C>>;
// Use z.infer to derive the ItemServerStateDescendantListType type
export type ItemServerStateDescendantListType = Array<ItemDescendantServerStateType>;
