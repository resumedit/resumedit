// @/schemas/id.ts

import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { v4 } from "uuid";
import { z } from "zod";

// https://ihateregex.io/expr/uuid/
const uuidRegex = "^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$";

const idRegex = "^[a-z0-9]{3,3}" + uuidRegex.slice(1);

// export const idSchema = z.string().uuid(); // UUID
export const idSchema = z.string().regex(RegExp(idRegex)); // UUID with prefix
export const idDefault = "nul-00000000-0000-0000-0000-000000000000";

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

export const idPrefix: Record<ItemDescendantModelNameType, string> = {
  user: "usr",
  resume: "res",
  organization: "org",
  role: "rol",
  achievement: "ach",
};

export function getItemId(kind: ItemDescendantModelNameType | null) {
  const kindPrefix = kind ? idPrefix[kind] || kind.substring(0, 3) : "und";
  return `${kindPrefix}-${v4()}`;
}
