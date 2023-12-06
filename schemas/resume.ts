// @/schemas/resume.ts

import { z } from "zod";
import { itemClientStateSchema, itemSchema } from "./item";

export const resumeFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const resumeSchema = {
  form: resumeFormSchema,
  display: resumeFormSchema,
  internal: resumeFormSchema,
  persistClient: itemSchema.persistClient.merge(resumeFormSchema),
  persistServer: itemSchema.persistServer.merge(resumeFormSchema),
};

export type ResumeInputType = z.input<typeof resumeSchema.persistServer>;
export type ResumeOutputType = z.output<typeof resumeSchema.persistServer>;

export const resumeItemClientStateSchema = itemClientStateSchema.merge(resumeFormSchema);
export type ResumeItemClientStateType = z.input<typeof resumeItemClientStateSchema>;
