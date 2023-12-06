import { keepOnlyFields } from "@/lib/utils/misc";
import { AchievementInputType, AchievementOutputType } from "@/schemas/achievement";
import { IdSchemaType } from "@/schemas/id";
import { ModificationTimestampType } from "./timestamp";

export type ClientIdType = IdSchemaType;

export enum AchievementDisposition {
  New = "NEW", // Not yet synced with the server
  Modified = "MODIFIED", // Modified on the client, needs syncing
  Deleted = "DELETED", // Marked for deletion
  Synced = "SYNCED",
}

export type AchievementClientStateType = AchievementInputType & {
  clientId: ClientIdType;
  disposition: AchievementDisposition;
  moved: boolean;
};

export type AchievementServerInputType = AchievementInputType & {
  disposition: AchievementDisposition;
};

export type AchievementListType = {
  parentId: IdSchemaType;
  lastModified: ModificationTimestampType;
};

export type AchievementListClientStateType = AchievementListType & {
  items: AchievementClientStateType[];
};

export type AchievementListServerStateType = AchievementListType & {
  items: AchievementOutputType[];
};

export type AchievementListServerInputType = AchievementListType & {
  items: AchievementServerInputType[];
};

export type AchievementListServerOutputType = AchievementListType & {
  items: AchievementOutputType[];
};

export const transformToAchievementServerInputType = (
  clientAchievement: AchievementClientStateType,
): AchievementServerInputType => {
  const allowedFields: Set<keyof AchievementServerInputType> = new Set([
    "id",
    "parentId",
    "createdAt",
    "lastModified",
    "content",
    "value",
    "order",
    "disposition",
  ] as Array<keyof AchievementServerInputType>);

  const inputAchievement = keepOnlyFields(clientAchievement, allowedFields);
  return inputAchievement;
};

export const transformToAchievementInputType = (
  clientAchievement: AchievementServerInputType,
): AchievementInputType => {
  const allowedFields: Set<keyof AchievementInputType> = new Set([
    "id",
    "createdAt",
    "lastModified",
    "content",
    "value",
    "order",
  ] as Array<keyof AchievementInputType>);

  const inputAchievement = keepOnlyFields(clientAchievement, allowedFields);
  return inputAchievement;
};
