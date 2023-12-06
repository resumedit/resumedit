// @/lib/utils/parentItemListUtils.ts

import { achievementItemSchema, achievementSchema } from "@/schemas/achievement";
import { itemSchema } from "@/schemas/item";
import { organizationItemSchema, organizationSchema } from "@/schemas/organization";
import { resumeItemSchema, resumeSchema } from "@/schemas/resume";
import { roleItemSchema, roleSchema } from "@/schemas/role";
import { ParentItemListStoreNameType } from "@/types/parentItemList";
import { ZodNumber, ZodObject, ZodTypeAny } from "zod";

export const getSchemaBasedOnStoreName = (storeName: ParentItemListStoreNameType) => {
  switch (storeName) {
    case "resume":
      return resumeSchema;
    case "organization":
      return organizationSchema;
    case "role":
      return roleSchema;
    case "achievement":
      return achievementSchema;
    default:
      return itemSchema;
  }
};

export const getItemSchemaBasedOnStoreName = (storeName: ParentItemListStoreNameType) => {
  switch (storeName) {
    case "resume":
      return resumeItemSchema;
    case "organization":
      return organizationItemSchema;
    case "role":
      return roleItemSchema;
    case "achievement":
      return achievementItemSchema;
    default:
      return itemSchema;
  }
};

export const getSchemaFields = (schema: ZodTypeAny): string[] => {
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
