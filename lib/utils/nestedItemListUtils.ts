// @/lib/utils/nestedItemListUtils.ts

import { achievementSchema } from "@/schemas/achievement";
import { itemSchema } from "@/schemas/item";
import { organizationSchema } from "@/schemas/organization";
import { resumeSchema } from "@/schemas/resume";
import { roleSchema } from "@/schemas/role";
import { NestedItemStoreNameType } from "@/types/nestedItem";
import { ZodNumber, ZodObject, ZodTypeAny } from "zod";

export type SchemaKindType = keyof Record<"form" | "display", ZodTypeAny>;

export const getItemSchema = (storeName: NestedItemStoreNameType, schemaKind: SchemaKindType) => {
  let schema: Record<SchemaKindType, ZodTypeAny>;

  switch (storeName) {
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
      schema = itemSchema;
      break;
  }

  return schema[schemaKind];
};

export const getSchemaFields = (storeName: NestedItemStoreNameType, schemaKind: SchemaKindType): string[] => {
  const schema = getItemSchema(storeName, schemaKind);
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
