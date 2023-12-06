import { z } from "zod";
import { idSchema } from "./id";

export const userFormSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const userInternalSchema = z.object({
  id: idSchema,
  authProviderId: z.string(),
});

export const userSchema = {
  form: userFormSchema,
  display: userFormSchema,
  internal: userInternalSchema,
  store: userFormSchema.merge(userInternalSchema),
};

export type UserInputType = z.input<typeof userSchema.store>;
export type UserOutputType = z.output<typeof userSchema.store>;
