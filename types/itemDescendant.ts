// @/types/itemDescendant.sx
import { stripFields } from "@/lib/utils/misc";
import { IdSchemaType } from "@/schemas/id";
import {
  ItemDescendantClientStateType,
  ItemDescendantStore,
  ItemDescendantStoreState,
} from "@/stores/itemDescendantStore/createItemDescendantStore";
import { PrismaClient } from "@prisma/client";
import { parse, stringify } from "devalue";
import { PersistStorage } from "zustand/middleware";
import { ItemClientStateType, ItemClientToServerType } from "./item";

// Ensure the below is a tuple by adding `as const`
export const itemDescendantModelHierarchy = ["user", "resume", "organization", "role", "achievement"] as const;
export type ItemDescendantModelNameType = (typeof itemDescendantModelHierarchy)[number];

/**
 * Type representing each model's parent and its descendants in the hierarchy.
 */
export type ItemDescendantModelAccessor = {
  [K in ItemDescendantModelNameType]: {
    parent: ItemDescendantModelNameType | null;
    child: ItemDescendantModelNameType | null;
  };
};

/**
 * Creates a mapping of each model to its parent and its descendants.
 */
const itemDescendantModels: ItemDescendantModelAccessor = itemDescendantModelHierarchy.reduce(
  (acc, model, index, array) => {
    acc[model] = {
      parent: index === 0 ? null : array[index - 1],
      child: index < array.length - 1 ? array[index + 1] : null,
    };
    return acc;
  },
  {} as ItemDescendantModelAccessor,
);

/**
 * Retrieves the parent of a given model from the hierarchy.
 * @param model - The model whose parent is to be found.
 * @returns The parent model or null if it's the top-level model.
 */
export function getParentModel(model: ItemDescendantModelNameType): ItemDescendantModelNameType | null {
  // return itemDescendantModels[model]?.parent || null;
  const entry = itemDescendantModels[model];
  if (entry) {
    return entry.parent;
  }
  return null;
}

/**
 * Retrieves the child of a given model from the hierarchy.
 * @param model - The model whose child is to be found.
 * @returns The child model or null if it's the bottom-level model.
 */
export function getDescendantModel(model: ItemDescendantModelNameType): ItemDescendantModelNameType | null {
  const entry = itemDescendantModels[model];
  if (entry) {
    return entry.child;
  }
  return null;
}

// Define a type that maps model names to Prisma model method types
// Define types for Prisma model methods
type PrismaModelMethodType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findUnique: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany: (args: any) => Promise<any>;
};

export type PrismaModelMethods = {
  [K in ItemDescendantModelNameType]: PrismaModelMethodType;
};

export function getModelAccessor(model: ItemDescendantModelNameType, prisma: PrismaClient): PrismaModelMethodType {
  // This function dynamically accesses the prisma model methods based on the model name
  // The as PrismaModelMethodType cast is safe as long as PrismaClient's API remains consistent with PrismaModelMethodType
  return prisma[model] as unknown as PrismaModelMethodType; // Adjust as needed for your Prisma setup
}

export function stripFieldsForDatabase<T extends ItemClientToServerType>(
  item: T,
  fieldsToStrip: Set<keyof T>,
  lastModified?: Date,
) {
  const strippedData = {
    ...stripFields(item, fieldsToStrip),
    lastModified: lastModified || new Date(),
  };

  return strippedData;
}

const fieldsToExcludeFromCreate = [
  "parentClientId",
  "clientId",
  "parentId",
  "id",
  "itemModel",
  "itemData",
  "descendantModel",
  "descendants",
  "disposition",
  "descendantDraft",
];

export function getItemDataForCreate<T extends ItemClientToServerType>(
  item: T,
  parentId: IdSchemaType,
  lastModified?: Date,
) {
  const fieldsToStrip = new Set<keyof T>([...fieldsToExcludeFromCreate] as Array<keyof T>);

  const itemData = stripFieldsForDatabase(item, fieldsToStrip, lastModified);

  // FIXME: The below code is no longer needed. It constructed a type-specific `parentId` clause, e.g.
  // { userId: parentId } for type `Resume`, as its parent type is 'User'
  // Now that we universally use the column name `parentId` the translation is no longer necessary
  // const parentModel = itemDescendantModels.find((pair) => pair.model === model)?.parent as keyof ItemDescendantModelAccessor;
  // const parentIdKeyValue = buildParentIdKeyValue(parentModel, parentId);
  // const parentIdKeyValue = { parentId };
  // const payload = { ...itemData, ...parentIdKeyValue };
  const payload = { ...itemData, parentId };
  return payload;
}

export function getItemDataForUpdate<T extends ItemClientToServerType>(item: T, lastModified?: Date) {
  const fieldsToStrip = new Set<keyof T>([...fieldsToExcludeFromCreate] as Array<keyof T>);

  const itemData = stripFieldsForDatabase(item, fieldsToStrip, lastModified);

  const payload = { ...itemData };
  return payload;
}

export function createTypesafeLocalstorage<
  I extends ItemClientStateType,
  C extends ItemClientStateType,
>(): PersistStorage<ItemDescendantStoreState<I, C>> {
  return {
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      return parse(str);
    },
    setItem: (name, value) => {
      // localStorage.setItem(name, stringify(value));
      // Create a deep clone of the value, excluding functions
      const valueWithoutFunctions = JSON.parse(
        JSON.stringify(value, (key, val) => (typeof val === "function" ? undefined : val)),
      );
      localStorage.setItem(name, stringify(valueWithoutFunctions));
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
    },
  };
}

export function createDateSafeLocalstorage<
  I extends ItemClientStateType,
  C extends ItemClientStateType,
>(): PersistStorage<ItemDescendantStoreState<I, C>> {
  return {
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      const jsonTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      return JSON.parse(str, (key, val) => (jsonTimestamp.test(val) ? new Date(val) : val));
    },
    setItem: (name, value) => {
      // localStorage.setItem(name, stringify(value));
      // Create a deep clone of the value, excluding functions
      const valueWithoutFunctions = JSON.parse(
        JSON.stringify(value, (key, val) => (typeof val === "function" ? undefined : val)),
      );
      localStorage.setItem(name, JSON.stringify(valueWithoutFunctions));
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
    },
  };
}
export function keepOnlyStateForServer<T extends ItemDescendantStore<ItemClientStateType, ItemClientStateType>>(
  rootState: T,
) {
  // Remove all properties that are not part of the item
  const storeActions: Array<keyof T> = [
    "setItemData",
    "markItemAsDeleted",
    "restoreDeletedItem",
    "getDescendants",
    "setDescendantData",
    "markDescendantAsDeleted",
    "reArrangeDescendants",
    "resetDescendantsOrderValues",
    "getDescendantDraft",
    "updateDescendantDraft",
    "commitDescendantDraft",
    "updateStoreWithServerData",
  ];
  const nonItemRootStateProperties: Array<keyof T> = ["descendantDraft"];

  // Combine both sets of keys to remove
  const fieldsToStrip = new Set<keyof T>([...storeActions, ...nonItemRootStateProperties]);

  const payload = stripFields(rootState, fieldsToStrip);
  return payload as ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>;
}
