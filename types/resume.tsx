// @/types/resume.ts
import { Edit, View } from "lucide-react";

export const resumeActionTypes = ["view", "edit"] as const;

export const resumeActionButtonIcons = {
  edit: <Edit />,
  view: <View />,
};

export type ResumeActionType = (typeof resumeActionTypes)[number];
