// @/types/item.ts
import { IdSchemaType } from "@/schemas/id";
import { ModificationTimestampType } from "./timestamp";

export enum ItemDisposition {
  New = "NEW",
  Modified = "MODIFIED",
  Deleted = "DELETED",
  Synced = "SYNCED",
}

// Basic type
export type ItemType = {
  id: IdSchemaType;
  parentId: IdSchemaType;
  createdAt: ModificationTimestampType;
  lastModified: ModificationTimestampType;
};
// Type to create records in Prisma with "id" optional
// 1. Omit<ItemType, 'id'> creates a type based on ItemType but without the id field.
// 2. & { id?: IdSchemaType } then adds id back as an optional field.
// The resulting ItemInputType will have all fields from ItemType with id being optional.

export type ItemInputType = Omit<ItemType, "id"> & {
  id?: IdSchemaType;
};
// Type of records returned by Prisma

export type ItemOutputType = ItemType;
// Type used when client sends items to server for merge

export type ItemClientToServerType = Omit<ItemType, "id"> & {
  id?: IdSchemaType;
  disposition: ItemDisposition;
};
// Type returned by server in response to items received from client to merge with server's state

export type ItemServerToClientType = ItemOutputType;
// Type used by client to maintain client state

export type ItemClientStateType = ItemClientToServerType & {
  clientId: IdSchemaType;
};

export type OrderableItemClientStateType = ItemClientStateType & {
  order: number;
};

// Type used by server to maintain server state
export type ItemServerStateType = ItemType;

// An object with fields that are specific to the item, i.e., excluding all the fields shared
// between `Resume`, `Organization`, `Role` and `Achievement`
export type ItemDataType<T extends ItemClientStateType> = Omit<T, keyof ItemClientStateType>;
export type ItemDataFieldNameType<T extends ItemClientStateType> = keyof ItemDataType<T>;

// FIXME: The following two types don't add much type safety but
// are currently used to be able to work with components without a type parameter
// export type ItemDataUntypedType = Omit<Record<string, unknown>, keyof ItemClientStateType>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export type ItemDataUntypedType = Omit<Record<string, any>, keyof ItemClientStateType> & Partial<ItemClientStateType>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ItemDataUntypedType = Omit<Record<string, any>, keyof ItemClientStateType>;
export type ItemDataUntypedFieldNameType = keyof ItemDataUntypedType;
