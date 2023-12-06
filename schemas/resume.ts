// @/schemas/resume.ts

import { z } from "zod";
import { itemSchema } from "./item";

export const resumeItemSchema = z.object({
  name: z.string().min(4),
  description: z.string().optional(),
  content: z.string().optional(),
});

export const resumeSchema = itemSchema.merge(resumeItemSchema);

export type ResumeInputType = z.input<typeof resumeSchema>;
export type ResumeOutputType = z.output<typeof resumeSchema>;
