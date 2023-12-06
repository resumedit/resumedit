import { achievementSchema } from "@/schemas/achievement";
import z from "zod";
import { ItemClientStateType, ItemClientToServerType, ItemServerToClientType, ItemType } from "./item";

export enum AchievementDisposition {
  New = "NEW", // Not yet synced with the server
  Modified = "MODIFIED", // Modified on the client, needs syncing
  Deleted = "DELETED", // Marked for deletion
  Synced = "SYNCED",
}

export interface AchievementItemType extends z.input<typeof achievementSchema.form>, ItemType {}

export interface AchievementItemClientStateType extends z.input<typeof achievementSchema.form>, ItemClientStateType {}

export interface AchievementItemServerStateType extends z.output<typeof achievementSchema.store>, ItemType {}

export interface AchievementItemClientToServerType
  extends z.input<typeof achievementSchema.form>,
    ItemClientToServerType {}

export interface AchievementItemServerToClientType
  extends z.output<typeof achievementSchema.form>,
    ItemServerToClientType {}
