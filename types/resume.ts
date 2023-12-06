// @/types/resume.ts
import { resumeSchema } from "@/schemas/resume";
import { ItemClientStateType, ItemClientToServerType, ItemServerToClientType, ItemType } from "./item";
import z from "zod";

export type ResumeActionType = "view" | "edit";

export interface ResumeItemType extends z.input<typeof resumeSchema.form>, ItemType {}

export interface ResumeItemClientStateType extends z.input<typeof resumeSchema.form>, ItemClientStateType {}

export interface ResumeItemServerStateType extends z.output<typeof resumeSchema.store>, ItemType {}

export interface ResumeItemClientToServerType extends z.input<typeof resumeSchema.form>, ItemClientToServerType {}

export interface ResumeItemServerToClientType extends z.output<typeof resumeSchema.form>, ItemServerToClientType {}
