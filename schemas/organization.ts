import { z } from "zod";
import { itemSchema } from "./item";

export const organizationItemSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(0),
});

export const organizationSchema = itemSchema.merge(organizationItemSchema);

export type OrganizationInputType = z.input<typeof organizationSchema>;
export type OrganizationOutputType = z.output<typeof organizationSchema>;
