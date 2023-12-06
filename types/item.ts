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
// Type used by server to maintain server state

export type ItemServerStateType = ItemType;
