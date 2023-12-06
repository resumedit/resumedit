import { organizationSchema } from "@/schemas/organization";
import z from "zod";
import {
  ItemClientStateType,
  ItemClientToServerType,
  ItemServerStateType,
  ItemServerToClientType,
  ItemType,
} from "./item";

export interface OrganizationItemType extends z.input<typeof organizationSchema.form>, ItemType {}
export interface OrganizationItemClientStateType extends z.input<typeof organizationSchema.form>, ItemClientStateType {}
export interface OrganizationItemServerStateType
  extends z.output<typeof organizationSchema.store>,
    ItemServerStateType {}
export interface OrganizationItemClientToServerType
  extends z.input<typeof organizationSchema.form>,
    ItemClientToServerType {}
export interface OrganizationItemServerToClientType
  extends z.output<typeof organizationSchema.form>,
    ItemServerToClientType {}
