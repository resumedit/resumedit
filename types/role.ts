import { roleSchema } from "@/schemas/role";
import z from "zod";
import {
  ItemClientStateType,
  ItemClientToServerType,
  ItemServerStateType,
  ItemServerToClientType,
  ItemType,
} from "./item";

export interface RoleItemType extends z.input<typeof roleSchema.form>, ItemType {}
export interface RoleItemClientStateType extends z.input<typeof roleSchema.form>, ItemClientStateType {}
export interface RoleItemServerStateType extends z.output<typeof roleSchema.store>, ItemServerStateType {}
export interface RoleItemClientToServerType extends z.input<typeof roleSchema.form>, ItemClientToServerType {}
export interface RoleItemServerToClientType extends z.output<typeof roleSchema.form>, ItemServerToClientType {}
