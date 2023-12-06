// @/schemas/id.ts

import { v4 } from "uuid";
import { z } from "zod";

export const idSchema = z.string().uuid(); // UUID
export const idDefault = "00000000-0000-0000-0000-000000000000";

export type IdSchemaType = z.infer<typeof idSchema>;

export const isValidItemId = (id: string | null | undefined): boolean => {
  if (id === null) return false;

  try {
    idSchema.parse(id);
    return true;
  } catch (error) {
    return false;
  }
};

export const getItemId = () => {
  return v4();
};
