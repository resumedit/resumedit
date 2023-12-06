// @/types/resume.ts
import { resumeSchema } from "@/schemas/resume";
import {
  ItemClientStateType,
  ItemClientToServerType,
  ItemServerStateType,
  ItemServerToClientType,
  ItemType,
} from "./item";
import z from "zod";
import { Edit, View } from "lucide-react";

export const resumeActionTypes = ["view", "edit"] as const;

export const resumeActionButtonIcons = {
  edit: <Edit />,
  view: <View />,
};

export type ResumeActionType = (typeof resumeActionTypes)[number];

export interface ResumeItemType extends z.input<typeof resumeSchema.form>, ItemType {}
export interface ResumeItemClientStateType extends z.input<typeof resumeSchema.form>, ItemClientStateType {}
export interface ResumeItemServerStateType extends z.output<typeof resumeSchema.store>, ItemServerStateType {}
export interface ResumeItemClientToServerType extends z.input<typeof resumeSchema.form>, ItemClientToServerType {}
export interface ResumeItemServerToClientType extends z.output<typeof resumeSchema.form>, ItemServerToClientType {}
