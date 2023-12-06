import { IdSchemaType } from "@/schemas/id";
import { OrganizationInputType, OrganizationOutputType } from "@/schemas/organization";
import { ItemClientStateType, ItemClientToServerType, ItemDisposition, ItemServerToClientType, ItemType } from "./item";
import { ModificationTimestampType } from "./timestamp";
import { ClientIdType } from "./item";

export interface OrganizationItemType extends ItemType {
  parentId: ItemType["parentId"];
  name: string;
  description?: string;
  content?: string;
}

export interface OrganizationItemClientStateType extends ItemClientStateType {
  parentId: ItemType["parentId"];
  name: string;
  description?: string;
  content?: string;
}

export interface OrganizationItemServerStateType extends ItemType {
  parentId: ItemType["parentId"];
  name: string;
  createdAt: Date;
  description: string;
  content: string;
}

export interface OrganizationItemClientToServerType extends ItemClientToServerType {
  parentId: ItemType["parentId"];
  name: string;
  description?: string;
  content?: string;
}

export interface OrganizationItemServerToClientType extends ItemServerToClientType {
  parentId: ItemType["parentId"];
  name: string;
  createdAt: Date;
  description: string;
  content: string;
}

// ----------------------------------------------------------

export type OrganizationClientStateType = OrganizationInputType & {
  clientId: ClientIdType;
  disposition: ItemDisposition;
};

export type OrganizationServerInputType = OrganizationInputType & {
  disposition: ItemDisposition;
};

export type OrganizationListType = {
  parentId: IdSchemaType;
  lastModified: ModificationTimestampType;
};

export type OrganizationListClientStateType = OrganizationListType & {
  items: OrganizationClientStateType[];
};

export type OrganizationListServerStateType = OrganizationListType & {
  parentId: IdSchemaType;
  items: OrganizationOutputType[];
};

export type OrganizationListServerInputType = OrganizationListType & {
  items: OrganizationServerInputType[];
};

export type OrganizationListServerOutputType = OrganizationListType & {
  items: OrganizationOutputType[];
};
