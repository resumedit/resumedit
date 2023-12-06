// @/types/resume.ts
import { IdSchemaType } from "@/schemas/id";
import { ResumeInputType, ResumeOutputType } from "@/schemas/resume";
import { ItemClientStateType, ItemClientToServerType, ItemDisposition, ItemServerToClientType, ItemType } from "./item";
import { ModificationTimestampType } from "./timestamp";

export type ClientIdType = IdSchemaType;

export interface ResumeItemType extends ItemType {
  parentId: ItemType["parentId"];
  name: string;
  description?: string;
  content?: string;
}

export interface ResumeItemClientStateType extends ItemClientStateType {
  parentId: ItemType["parentId"];
  name: string;
  description?: string;
  content?: string;
}

export interface ResumeItemServerStateType extends ItemType {
  parentId: ItemType["parentId"];
  name: string;
  createdAt: Date;
  description: string;
  content: string;
}

export interface ResumeItemClientToServerType extends ItemClientToServerType {
  parentId: ItemType["parentId"];
  name: string;
  description?: string;
  content?: string;
}

export interface ResumeItemServerToClientType extends ItemServerToClientType {
  parentId: ItemType["parentId"];
  name: string;
  createdAt: Date;
  description: string;
  content: string;
}

// ----------------------------------------------------------

export type ResumeClientStateType = ResumeInputType & {
  clientId: ClientIdType;
  disposition: ItemDisposition;
};

export type ResumeServerInputType = ResumeInputType & {
  disposition: ItemDisposition;
};

export type ResumeListType = {
  parentId: IdSchemaType;
  lastModified: ModificationTimestampType;
};

export type ResumeListClientStateType = ResumeListType & {
  items: ResumeClientStateType[];
};

export type ResumeListServerStateType = ResumeListType & {
  parentId: IdSchemaType;
  items: ResumeOutputType[];
};

export type ResumeListServerInputType = ResumeListType & {
  items: ResumeServerInputType[];
};

export type ResumeListServerOutputType = ResumeListType & {
  items: ResumeOutputType[];
};
