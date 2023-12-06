// @/types/nestedItem.sx
import { stripFields } from "@/lib/utils/misc";
import { IdSchemaType } from "@/schemas/id";
import { NestedItemState } from "@/stores/nestedItemStore/createNestedItemStore";
import { PrismaClient } from "@prisma/client";
import { parse, stringify } from "devalue";
import { PersistStorage } from "zustand/middleware";
import { ModificationTimestampType } from "./timestamp";

export type ClientIdType = IdSchemaType;

export enum NestedItemDisposition {
  New = "NEW",
  Modified = "MODIFIED",
  Synced = "SYNCED",
}

// Basic type
export type NestedItemType = {
  id: IdSchemaType;
  parentId: IdSchemaType;
  createdAt: ModificationTimestampType;
  lastModified: ModificationTimestampType;
  deletedAt: ModificationTimestampType | null;
};

// Type to create records in Prisma with "id" optional
// 1. Omit<NestedItemType, 'id'> creates a type based on NestedItemType but without the id field.
// 2. & { id?: IdSchemaType } then adds id back as an optional field.
// The resulting NestedItemInputType will have all fields from NestedItemType with id being optional.
export type NestedItemInputType = Omit<NestedItemType, "id"> & {
  id?: IdSchemaType;
};

// Type of records returned by Prisma
export type NestedItemOutputType = NestedItemType;

// Type used when client sends items to server for merge
export type NestedItemClientToServerType = Omit<NestedItemType, "id"> & {
  id?: IdSchemaType;
  disposition: NestedItemDisposition;
};

// Type returned by server in response to items received from client to merge with server's state
export type NestedItemServerToClientType = NestedItemOutputType;

// Type used by client to maintain client state
export type NestedItemClientStateType = NestedItemClientToServerType & {
  clientId: IdSchemaType;
};

export type OrderableItemClientStateType = NestedItemClientStateType & {
  order: number;
};

// Type used by server to maintain server state
export type NestedItemServerStateType = NestedItemType;

// Type used when client sends items to server for merge
// As both items and their descendants are created on the client, they may have
// neither a parentId nor an id until they have been synchronized with the server
export type NestedItemDescendantClientToServerType = Omit<NestedItemType, "parentId" | "id"> & {
  parentId?: IdSchemaType;
  id?: IdSchemaType;
  disposition: NestedItemDisposition;
};

// Type used by client to maintain client state
export type NestedItemDescendantClientStateType = NestedItemDescendantClientToServerType & {
  clientId: IdSchemaType;
};

export type NestedItemOrderableChildClientStateType = NestedItemDescendantClientStateType & {
  order: number;
};

// An object with fields that are specific to the item, i.e., excluding all the fields shared
// between `Resume`, `Organization`, `Role` and `Achievement`
export type NestedItemDescendantDataType<T extends NestedItemDescendantClientStateType> = Omit<
  T,
  keyof NestedItemDescendantClientStateType
>;
export type NestedItemDescendantDataFieldNameType<T extends NestedItemDescendantClientStateType> =
  keyof NestedItemDescendantDataType<T>;

// FIXME: The following two types don't add much type safety but
// are currently used to be able to work with components without a type parameter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NestedItemDescendantDataUntypedType = Omit<Record<string, any>, keyof NestedItemDescendantClientStateType>;
export type NestedItemDescendantDataUntypedFieldNameType = keyof NestedItemDescendantDataUntypedType;

export const nestedItemModelHierarchy = ["user", "resume", "organization", "role", "achievement"];

/**
 * Type representing each model's parent and its descendants in the hierarchy.
 */
export type NestedItemModelAccessor = {
  [K in (typeof nestedItemModelHierarchy)[number]]: {
    parent: string | null;
    child: string | null;
  };
};

/**
 * Creates a mapping of each model to its parent and its descendants.
 */
const nestedItemModels = nestedItemModelHierarchy.reduce((acc, model, index, array) => {
  acc[model] = {
    parent: index === 0 ? null : array[index - 1],
    child: index < array.length - 1 ? array[index + 1] : null,
  };
  return acc;
}, {} as NestedItemModelAccessor);

/**
 * Retrieves the parent of a given model from the hierarchy.
 * @param model - The model whose parent is to be found.
 * @returns The parent model or null if it's the top-level model.
 */
export function getParentModel(model: keyof NestedItemModelAccessor): keyof NestedItemModelAccessor | null {
  const entry = nestedItemModels[model];
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
export function getDescendantModel(model: keyof NestedItemModelAccessor): keyof NestedItemModelAccessor | null {
  const entry = nestedItemModels[model];
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

export type NestedItemModelNameType = (typeof nestedItemModelHierarchy)[number];
type PrismaModelMethods = {
  [K in NestedItemModelNameType]: PrismaModelMethodType;
};

export function getModelAccessor(
  model: NestedItemModelNameType,
  prisma: PrismaClient,
): PrismaModelMethods[NestedItemModelNameType] {
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
  for (const [model, { parent }] of Object.entries(nestedItemModels)) {
    if (parent) {
      keys.add(`${parent}Id`);
    }
  }
  return keys;
}

// A nested item list comprises:
// Its root inherits from the item model to which all child models belong.
// For example if the item type is `Resume`, then the child is its
// successor in the array nestedItemModelHierarchy, which is currently `Organization`.
// Its column `parentId` refers to the `User` model instance that owns the resume
// descendants: an array of child model instances, e.g., Array<Organization>
export type NestedItemListType<I, C> = I & {
  parentId: IdSchemaType;
  itemModel: NestedItemModelNameType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descendants: NestedItemListType<C, any>[];
};

// List of parentId keys to be stripped from objects
export const parentIdKeys = generateParentIdKeys();

type ParentIdKey = `${keyof NestedItemModelAccessor}Id`;

export function stripFieldsForDatabase<T extends NestedItemClientToServerType>(
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

const fieldsToExcludeFromCreate = ["id", "parentId", "clientId", "items", "moved", "disposition"];

export function keepOnlyFieldsForCreate<T extends NestedItemClientToServerType>(
  item: T,
  parentId: IdSchemaType,
  lastModified?: Date,
) {
  const fieldsToStrip = new Set<keyof T>([...fieldsToExcludeFromCreate] as Array<keyof T>);

  const itemData = stripFieldsForDatabase(item, fieldsToStrip, lastModified);

  // FIXME: The below code is no longer needed. It constructed a type-specific `parentId` clause, e.g.
  // { userId: parentId } for type `Resume`, as its parent type is 'User'
  // Now that we universally use the column name `parentId` the translation is no longer necessary
  // const parentModel = nestedItemModels.find((pair) => pair.model === model)?.parent as keyof NestedItemModelAccessor;
  // const parentIdKeyValue = buildParentIdKeyValue(parentModel, parentId);
  const parentIdKeyValue = { parentId };

  const payload = { ...itemData, ...parentIdKeyValue };
  return payload;
}

export function keepOnlyFieldsForUpdate<T extends NestedItemClientToServerType>(item: T, lastModified?: Date) {
  const fieldsToStrip = new Set<keyof T>([...fieldsToExcludeFromCreate, ...parentIdKeys] as Array<keyof T>);

  const itemData = stripFieldsForDatabase(item, fieldsToStrip, lastModified);

  const payload = { ...itemData };
  return payload;
}

export function buildWhereClause(parentModel: keyof NestedItemModelAccessor, parentId: IdSchemaType) {
  const whereClause: Partial<Record<ParentIdKey, IdSchemaType>> = {};
  const key = `${parentModel}Id` as ParentIdKey;
  whereClause[key] = parentId;
  return whereClause;
}

export function buildParentIdKeyValue(parentModel: keyof NestedItemModelAccessor, parentId: IdSchemaType) {
  const parentIdKeyValue: Partial<Record<ParentIdKey, IdSchemaType>> = {};
  const key = `${parentModel}Id` as ParentIdKey;
  parentIdKeyValue[key] = parentId;
  return parentIdKeyValue;
}

export function createTypesafeLocalstorage<
  P extends NestedItemDescendantClientStateType,
  I extends NestedItemDescendantClientStateType,
>(): PersistStorage<NestedItemState<P, I>> {
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
