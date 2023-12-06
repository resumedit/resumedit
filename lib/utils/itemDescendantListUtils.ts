// @/lib/utils/itemDescendantListUtils.ts

import { achievementSchema } from "@/schemas/achievement";
import { organizationSchema } from "@/schemas/organization";
import { resumeSchema } from "@/schemas/resume";
import { roleSchema } from "@/schemas/role";
import { userSchema } from "@/schemas/user";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { ZodNumber, ZodObject, ZodTypeAny } from "zod";

export type SchemaKindType = keyof Record<"form" | "display", ZodTypeAny>;

export const getItemSchema = (itemModel: ItemDescendantModelNameType, schemaKind: SchemaKindType) => {
  let schema: Record<SchemaKindType, ZodTypeAny>;

  switch (itemModel) {
    case "user":
      schema = userSchema;
      break;
    case "resume":
      schema = resumeSchema;
      break;
    case "organization":
      schema = organizationSchema;
      break;
    case "role":
      schema = roleSchema;
      break;
    case "achievement":
      schema = achievementSchema;
      break;
    default:
      throw Error(`getItemSchema(itemModel="${itemModel}", schemaKind="${schemaKind}"): Schema not found`);
      break;
  }

  return schema[schemaKind];
};

export const getSchemaFields = (itemModel: ItemDescendantModelNameType, schemaKind: SchemaKindType): string[] => {
  const schema = getItemSchema(itemModel, schemaKind);
  const shape = schema._def.shape();
  return Object.keys(shape);
};

// Utility to check if a field is a number type in the schema
export const isNumberField = (schema: ZodTypeAny, fieldName: string): boolean => {
  // Ensure the schema is an object schema
  if (schema instanceof ZodObject) {
    const fieldSchema = schema.shape[fieldName];
    return fieldSchema instanceof ZodNumber;
  }
  return false;
};
