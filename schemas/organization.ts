// @/schemas/organization.ts

import { z } from "zod";
import { itemClientStateSchema, itemSchema } from "./item";

export const organizationFormSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().default(""),
});

export const organizationSchema = {
  form: organizationFormSchema,
  display: organizationFormSchema,
  internal: organizationFormSchema,
  persistServer: itemSchema.persistServer.merge(organizationFormSchema),
};

export type OrganizationInputType = z.input<typeof organizationSchema.persistServer>;
export type OrganizationOutputType = z.output<typeof organizationSchema.persistServer>;

export const organizationItemClientStateSchema = itemClientStateSchema.merge(organizationFormSchema);
export type OrganizationItemClientStateType = z.input<typeof organizationItemClientStateSchema>;
