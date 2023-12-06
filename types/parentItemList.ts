// @/types/parentItemList.sx
import { stripFields } from "@/lib/utils/misc";
import { IdSchemaType } from "@/schemas/id";
import { PrismaClient } from "@prisma/client";
import {
  ItemClientStateType,
  ItemClientToServerType,
  ItemDataType,
  ItemDataUntypedType,
  ItemDisposition,
  ItemOutputType,
  OrderableItemClientStateType,
} from "./item";
import { ModificationTimestampType } from "./timestamp";

export type ClientIdType = IdSchemaType;

// A parent item list comprises:
// parentId:     identifies the parent instance and is an alias for the specific
//               parent identifier of the item model.
//               For example if the parent is `User`, the item is `Resume`
//               and its column `parentId` refers to the user that owns the resume
// lastModified: a timestamp when anything in the parent item list
//               was last modified
// item:         array of itemren, e.g., Array<Resume>
export type ParentItemListType<T> = {
  parentId: IdSchemaType;
  lastModified: ModificationTimestampType;
  items: T[];
};

export const parentItemModelHierarchy = ["user", "resume", "organization", "role", "achievement"];

/**
 * Type representing each model's parent and item in the hierarchy.
 */
export type ParentItemModelAccessor = {
  [K in (typeof parentItemModelHierarchy)[number]]: {
    parent: string | null;
    item: string | null;
  };
};

/**
 * Creates a mapping of each model to its parent and item.
 */
const parentItemModels = parentItemModelHierarchy.reduce((acc, model, index, array) => {
  acc[model] = {
    parent: index === 0 ? null : array[index - 1],
    item: index < array.length - 1 ? array[index + 1] : null,
  };
  return acc;
}, {} as ParentItemModelAccessor);

/**
 * Retrieves the parent of a given model from the hierarchy.
 * @param model - The model whose parent is to be found.
 * @returns The parent model or null if it's the top-level model.
 */
export function getParentModel(model: keyof ParentItemModelAccessor): keyof ParentItemModelAccessor | null {
  const entry = parentItemModels[model];
  if (entry) {
    return entry.parent;
  }
  throw new Error(`getParentModel(model=${model}): model not found`);
}

/**
 * Retrieves the item of a given model from the hierarchy.
 * @param model - The model whose item is to be found.
 * @returns The item model or null if it's the bottom-level model.
 */
export function getItemModel(model: keyof ParentItemModelAccessor): keyof ParentItemModelAccessor | null {
  const entry = parentItemModels[model];
  if (entry) {
    return entry.item;
  }
  throw new Error(`getItemModel(model=${model}): model not found`);
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

type ParentItemModelNameType = (typeof parentItemModelHierarchy)[number];
type PrismaModelMethods = {
  [K in ParentItemModelNameType]: PrismaModelMethodType;
};

export function getModelAccessor(
  model: ParentItemModelNameType,
  prisma: PrismaClient,
): PrismaModelMethods[ParentItemModelNameType] {
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
  for (const [model, { parent }] of Object.entries(parentItemModels)) {
    if (parent) {
      keys.add(`${parent}Id`);
    }
  }
  return keys;
}

// List of parentId keys to be stripped from objects
export const parentIdKeys = generateParentIdKeys();

type ParentIdKey = `${keyof ParentItemModelAccessor}Id`;

export type ParentItemListStoreNameType = keyof ParentItemModelAccessor;

export type ParentItemListState<T extends ItemClientStateType> = {
  parentModel: keyof ParentItemModelAccessor | null;
  parentId: IdSchemaType | null;
  itemModel: keyof ParentItemModelAccessor;
  items: T[];
  itemDraft: ItemDataType<T>;
  lastModified: ModificationTimestampType;
  serverModified: ModificationTimestampType;
  synchronizationInterval: number;
};

export type ParentItemListActions<T extends ItemClientStateType> = {
  getParentId: () => IdSchemaType | null;
  setParentId: (id: IdSchemaType) => void;
  getItemList: () => T[];
  setItemList: (items: T[]) => void;
  deleteItemsByDisposition: (disposition?: ItemDisposition) => void;
  addItem: (payload: ItemDataType<T>) => ClientIdType;
  setItemSynced: (clientId: ClientIdType, serverData: ItemOutputType) => void;
  setItemDeleted: (clientId: ClientIdType) => void;
  deleteItem: (clientId: ClientIdType) => void;
  setItemData: (clientId: ClientIdType, data: ItemDataUntypedType) => void;
  reArrangeItemList: (reArrangedItems: OrderableItemClientStateType[]) => void;
  resetItemListOrderValues: () => void;
  updateItemDraft: (itemData: ItemDataUntypedType) => void;
  commitItemDraft: () => void;
  updateStoreWithServerData: (serverState: ParentItemListType<ItemOutputType>) => void;
  setLastModified: (timestamp: ModificationTimestampType) => void;
  getLastModified: () => ModificationTimestampType;
  setSynchronizationInterval: (interval: number) => void;
  getSynchronizationInterval: () => number;
};

export type ParentItemListStore<T extends ItemClientStateType> = ParentItemListState<T> & ParentItemListActions<T>;

type ParentItemListStoreType = ParentItemListStore<ItemClientStateType>;
type ParentItemListSelectorType<T> = (state: ParentItemListStoreType) => T;
export type ParentItemListHookType = <T>(selector?: ParentItemListSelectorType<T>) => T;

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

const fieldsToExcludeFromCreate = ["id", "parentId", "clientId", "items", "moved", "disposition"];

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
  // const parentModel = parentItemModels.find((pair) => pair.model === model)?.parent as keyof ParentItemModelAccessor;
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

export function buildWhereClause(parentModel: keyof ParentItemModelAccessor, parentId: IdSchemaType) {
  const whereClause: Partial<Record<ParentIdKey, IdSchemaType>> = {};
  const key = `${parentModel}Id` as ParentIdKey;
  whereClause[key] = parentId;
  return whereClause;
}

export function buildParentIdKeyValue(parentModel: keyof ParentItemModelAccessor, parentId: IdSchemaType) {
  const parentIdKeyValue: Partial<Record<ParentIdKey, IdSchemaType>> = {};
  const key = `${parentModel}Id` as ParentIdKey;
  parentIdKeyValue[key] = parentId;
  return parentIdKeyValue;
}
