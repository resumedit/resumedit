// @/types/itemDescendant.sx
import { stripFields } from "@/lib/utils/misc";
import { IdSchemaType } from "@/schemas/id";
import { ItemDescendantStoreState } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { PrismaClient } from "@prisma/client";
import { parse, stringify } from "devalue";
import { PersistStorage } from "zustand/middleware";
import { ItemClientStateType, ItemClientToServerType } from "./item";

export const itemDescendantModelHierarchy = ["user", "resume", "organization", "role", "achievement"];

/**
 * Type representing each model's parent and its descendants in the hierarchy.
 */
export type ItemDescendantModelAccessor = {
  [K in (typeof itemDescendantModelHierarchy)[number]]: {
    parent: string | null;
    child: string | null;
  };
};

/**
 * Creates a mapping of each model to its parent and its descendants.
 */
const itemDescendantModels = itemDescendantModelHierarchy.reduce((acc, model, index, array) => {
  acc[model] = {
    parent: index === 0 ? null : array[index - 1],
    child: index < array.length - 1 ? array[index + 1] : null,
  };
  return acc;
}, {} as ItemDescendantModelAccessor);

/**
 * Retrieves the parent of a given model from the hierarchy.
 * @param model - The model whose parent is to be found.
 * @returns The parent model or null if it's the top-level model.
 */
export function getParentModel(model: keyof ItemDescendantModelAccessor): keyof ItemDescendantModelAccessor | null {
  const entry = itemDescendantModels[model];
  if (entry) {
    return entry.parent;
  }
  return null;
  // throw new Error(`getParentModel(model=${model}): model not found`);
}

/**
 * Retrieves the child of a given model from the hierarchy.
 * @param model - The model whose child is to be found.
 * @returns The child model or null if it's the bottom-level model.
 */
export function getDescendantModel(model: keyof ItemDescendantModelAccessor): keyof ItemDescendantModelAccessor | null {
  const entry = itemDescendantModels[model];
  if (entry) {
    return entry.child;
  }
  return null;
  // throw new Error(`getDescendantModel(model=${model}): model not found`);
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

export type ItemDescendantModelNameType = (typeof itemDescendantModelHierarchy)[number];
type PrismaModelMethods = {
  [K in ItemDescendantModelNameType]: PrismaModelMethodType;
};

export function getModelAccessor(
  model: ItemDescendantModelNameType,
  prisma: PrismaClient,
): PrismaModelMethods[ItemDescendantModelNameType] {
  // This function dynamically accesses the prisma model methods based on the model name
  // The as PrismaModelMethodType cast is safe as long as PrismaClient's API remains consistent with PrismaModelMethodType
  return prisma[model as keyof PrismaClient] as PrismaModelMethodType;
}
/**
 * Generates a set of keys for parent IDs based on the model hierarchy.
 * @returns A set of strings representing parent ID keys.
 */
function generateParentIdKeys(): Set<string> {
  const keys = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [model, { parent }] of Object.entries(itemDescendantModels)) {
    if (parent) {
      keys.add(`${parent}Id`);
    }
  }
  return keys;
}

// List of parentId keys to be stripped from objects
export const parentIdKeys = generateParentIdKeys();

type ParentIdKey = `${keyof ItemDescendantModelAccessor}Id`;

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
  "descendantModel",
  "descendants",
  "disposition",
  "descendantDraft",
];

export function keepOnlyFieldsForCreate<T extends ItemClientToServerType>(
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
  const parentIdKeyValue = { parentId };

  const payload = { ...itemData, ...parentIdKeyValue };
  return payload;
}

export function keepOnlyFieldsForUpdate<T extends ItemClientToServerType>(item: T, lastModified?: Date) {
  const fieldsToStrip = new Set<keyof T>([...fieldsToExcludeFromCreate, ...parentIdKeys] as Array<keyof T>);

  const itemData = stripFieldsForDatabase(item, fieldsToStrip, lastModified);

  const payload = { ...itemData };
  return payload;
}

export function buildWhereClause(parentModel: keyof ItemDescendantModelAccessor, parentId: IdSchemaType) {
  const whereClause: Partial<Record<ParentIdKey, IdSchemaType>> = {};
  const key = `${parentModel}Id` as ParentIdKey;
  whereClause[key] = parentId;
  return whereClause;
}

export function buildParentIdKeyValue(parentModel: keyof ItemDescendantModelAccessor, parentId: IdSchemaType) {
  const parentIdKeyValue: Partial<Record<ParentIdKey, IdSchemaType>> = {};
  const key = `${parentModel}Id` as ParentIdKey;
  parentIdKeyValue[key] = parentId;
  return parentIdKeyValue;
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
