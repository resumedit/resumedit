import { z } from "zod";
import { idSchema } from "./id";
import { OrganizationOutputType, organizationSchema } from "./organization";
import { ResumeOutputType, resumeSchema } from "./resume";

export const userSchema = z.object({
  id: idSchema,
  authProviderId: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizations: z.array(organizationSchema).default(Array<OrganizationOutputType>),
  resumes: z.array(resumeSchema).default(Array<ResumeOutputType>),
});

export type UserSchemaInput = z.input<typeof userSchema>;
export type UserSchemaOutput = z.output<typeof userSchema>;
