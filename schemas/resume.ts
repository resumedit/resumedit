// @/schemas/resume.ts

import { z } from "zod";
import { itemSchema } from "./item";

export const resumeFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const resumeSchema = {
  form: resumeFormSchema,
  display: resumeFormSchema,
  internal: resumeFormSchema,
  store: itemSchema.store.merge(resumeFormSchema),
};

export type ResumeInputType = z.input<typeof resumeSchema.store>;
export type ResumeOutputType = z.output<typeof resumeSchema.store>;
