// @/schemas/id.ts

import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { v4 } from "uuid";
import { z } from "zod";

// https://ihateregex.io/expr/uuid/
// Match a UUID
const uuidRegex = String.raw`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`;

// Match UUIDs with a three-letter prefix, separated by a single dash:
//     A prefix of exactly three lowercase alpha-numeric characters
//     then a dash
//     and finally the UUID regex without the first character (`^`)
export const idRegex = String.raw`^[a-z0-9]{3,3}` + String.raw`-` + uuidRegex.slice(1);

// export const idSchema = z.string().uuid(); // UUID
export const idSchema = z.string().regex(RegExp(idRegex)); // UUID with prefix
export const idDefault = "nul-00000000-0000-0000-0000-000000000000";

export type IdSchemaType = z.infer<typeof idSchema>;

export const isValidItemId = (id: string | null | undefined): boolean => {
  if (!(typeof id === "string")) return false;

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

function findKeyByValue(map: object, value: string): string | undefined {
  for (const [key, val] of Object.entries(map)) {
    if (val === value) {
      return key;
    }
  }
  return undefined; // Or any appropriate default value
}

export function getItemModelFromId(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  if (isValidItemId(id)) {
    return findKeyByValue(idPrefix, id.slice(0, 3));
  }
  return undefined;
}

export function getPrefixFromId(id: string | null | undefined, length: number = 4): string | undefined {
  if (!id) return undefined;
  if (isValidItemId(id)) {
    return id.substring(4, 4 + length);
  }
  return undefined;
}
