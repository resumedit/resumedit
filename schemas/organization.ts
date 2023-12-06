// @/schemas/organization.ts

import { z } from "zod";
import { itemSchema } from "./item";

export const organizationFormSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().default(""),
});

export const organizationSchema = {
  form: organizationFormSchema,
  display: organizationFormSchema,
  internal: organizationFormSchema,
  store: itemSchema.store.merge(organizationFormSchema),
};

export type OrganizationInputType = z.input<typeof organizationSchema.store>;
export type OrganizationOutputType = z.output<typeof organizationSchema.store>;
