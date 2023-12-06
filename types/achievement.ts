import { achievementSchema } from "@/schemas/achievement";
import z from "zod";
import {
  ItemClientStateType,
  ItemClientToServerType,
  ItemServerStateType,
  ItemServerToClientType,
  ItemType,
} from "./item";

export interface AchievementItemType extends z.input<typeof achievementSchema.form>, ItemType {}
export interface AchievementItemClientStateType extends z.input<typeof achievementSchema.form>, ItemClientStateType {}
export interface AchievementItemServerStateType extends z.output<typeof achievementSchema.store>, ItemServerStateType {}
export interface AchievementItemClientToServerType
  extends z.input<typeof achievementSchema.form>,
    ItemClientToServerType {}
export interface AchievementItemServerToClientType
  extends z.output<typeof achievementSchema.form>,
    ItemServerToClientType {}
