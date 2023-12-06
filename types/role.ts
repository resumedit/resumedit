// @/types/role.ts
import { IdSchemaType } from "@/schemas/id";
import { RoleInputType, RoleOutputType } from "@/schemas/role";
import { ItemClientStateType, ItemClientToServerType, ItemDisposition, ItemServerToClientType, ItemType } from "./item";
import { ClientIdType } from "./item";
import { ModificationTimestampType } from "./timestamp";

export interface RoleItemType extends ItemType {
  name: string;
  description?: string;
  content?: string;
}

export interface RoleItemClientStateType extends ItemClientStateType {
  name: string;
  description?: string;
  content?: string;
}

export interface RoleItemServerStateType extends ItemType {
  name: string;
  createdAt: Date;
  description: string;
  content: string;
}

export interface RoleItemClientToServerType extends ItemClientToServerType {
  name: string;
  description?: string;
  content?: string;
}

export interface RoleItemServerToClientType extends ItemServerToClientType {
  name: string;
  createdAt: Date;
  description: string;
  content: string;
}

// ----------------------------------------------------------

export type RoleClientStateType = RoleInputType & {
  clientId: ClientIdType;
  disposition: ItemDisposition;
};

export type RoleServerInputType = RoleInputType & {
  disposition: ItemDisposition;
};

export type RoleListType = {
  parentId: IdSchemaType;
  lastModified: ModificationTimestampType;
};

export type RoleListClientStateType = RoleListType & {
  items: RoleClientStateType[];
};

export type RoleListServerStateType = RoleListType & {
  parentId: IdSchemaType;
  items: RoleOutputType[];
};

export type RoleListServerInputType = RoleListType & {
  items: RoleServerInputType[];
};

export type RoleListServerOutputType = RoleListType & {
  items: RoleOutputType[];
};
