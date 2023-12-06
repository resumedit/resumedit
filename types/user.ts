// @/types/user.ts
import { userSchema } from "@/schemas/user";
import z from "zod";
import { ItemClientStateType, ItemClientToServerType, ItemServerToClientType, ItemType } from "./item";

export type UserActionType = "view" | "edit";

export interface UserItemType extends z.input<typeof userSchema.form>, ItemType {}

export interface UserItemClientStateType extends z.input<typeof userSchema.form>, ItemClientStateType {}

export interface UserItemServerStateType extends z.output<typeof userSchema.store>, ItemType {}

export interface UserItemClientToServerType extends z.input<typeof userSchema.form>, ItemClientToServerType {}

export interface UserItemServerToClientType extends z.output<typeof userSchema.form>, ItemServerToClientType {}
