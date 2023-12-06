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
//               parent identifier of the child model.
//               For example if the parent is `User`, the child is `Resume`
//               and its column `parentId` refers to the user that owns the resume
// lastModified: a timestamp when anything in the parent item list
//               was last modified
// item:         array of children, e.g., Array<Resume>
export type ParentItemListType<T> = {
  parentId: IdSchemaType;
  lastModified: ModificationTimestampType;
  items: T[];
};

// Define types for Prisma model methods
type PrismaModelMethods = {
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

export type ModelAccessor = {
  achievement: typeof PrismaClient.prototype.achievement;
  role: typeof PrismaClient.prototype.role;
  organization: typeof PrismaClient.prototype.organization;
  resume: typeof PrismaClient.prototype.resume;
  user: typeof PrismaClient.prototype.user;
  // Add other models as needed in both ModelAccessor and getModelAccessor
};

export function getModelAccessor(model: ParentItemListStoreNameType, prisma: PrismaClient): PrismaModelMethods {
  const modelAccessors: ModelAccessor = {
    achievement: prisma.achievement,
    role: prisma.role,
    organization: prisma.organization,
    resume: prisma.resume,
    user: prisma.user,
    // Add other models as needed in both ModelAccessor and getModelAccessor
  };
  return modelAccessors[model as keyof ModelAccessor] as PrismaModelMethods;
}

const parentItemModelHierarchy = ["user", "resume", "organization", "role", "achievement"];

const parentItemModels = parentItemModelHierarchy.map((model, index) => {
  return {
    model: model,
    parent: index === 0 ? null : parentItemModelHierarchy[index - 1],
  };
});

export type ParentItemModelAccessor = {
  [K in (typeof parentItemModels)[number]["model"]]: {
    parent: (typeof parentItemModels)[number]["parent"];
  };
};

export type ParentItemListStoreNameType = keyof ParentItemModelAccessor;

export type ParentItemListState<T extends ItemClientStateType> = {
  parentModel: keyof ParentItemModelAccessor;
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

// Returns the parent model or null
// Example: for the model `achievement`, it returns `role`
// For `user`, it returns `null` because `user` does not have a parent
export function getParentModel(model: keyof ParentItemModelAccessor): keyof ParentItemModelAccessor {
  const entry = parentItemModels.find((m) => m.model === model);
  if (entry) {
    if (entry.parent) {
      return entry.parent as keyof ParentItemModelAccessor;
    }
    throw new Error(`getParentModel(model=${model}): parent of model not found`);
  }
  throw new Error(`getParentModel(model=${model}): model not found`);
}

function generateParentIdKeys(): Set<string> {
  const keys = new Set<string>();
  parentItemModels.forEach((item) => {
    if (item.parent) {
      keys.add(`${item.parent}Id`);
    }
  });
  return keys;
}

// List of parentId keys to be stripped from objects
export const parentIdKeys = generateParentIdKeys();

type ParentIdKey = `${keyof ParentItemModelAccessor}Id`;

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
