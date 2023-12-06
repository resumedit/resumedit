// @/lib/utils/itemDescendantListUtils.ts

import { achievementSchema } from "@/schemas/achievement";
import { ItemDataUntypedFieldNameType } from "@/schemas/item";
import { organizationSchema } from "@/schemas/organization";
import { resumeSchema } from "@/schemas/resume";
import { roleSchema } from "@/schemas/role";
import { userSchema } from "@/schemas/user";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { InputProps } from "react-editext";
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
// // Convert array to union type
// type ItemFormFieldKeys = (typeof itemFormFields)[number];
// // Define updatedKeyValue type
// type FormKeyValueType = {
//   key: ItemFormFieldKeys;
//   value: string | number;
// };
type FormKeyValueType = Record<string, string | number>;
function extractFieldName(input: string): ItemDataUntypedFieldNameType {
  const parts = input.split("-");
  return parts[parts.length - 1];
}
function getUpdatedKeyValueFromEvent(
  event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
): FormKeyValueType | undefined {
  if (event && event.target?.name) {
    const updatedKeyValue = {
      key: extractFieldName(event.target.name),
      value: event.target.value,
    };
    return updatedKeyValue;
  }
}
function getUpdatedKeyValueFromEdiTextField(value?: string, inputProps?: InputProps): FormKeyValueType | undefined {
  if (value && inputProps?.name) {
    const updatedKeyValue = {
      key: extractFieldName(inputProps.name),
      value,
    };
    return updatedKeyValue;
  }
}
function parseUpdate(itemFormSchema: ZodTypeAny, updatedKeyValue: FormKeyValueType | undefined) {
  if (typeof updatedKeyValue === "undefined") return;
  // Check if the field is a number and parse it
  if (isNumberField(itemFormSchema, updatedKeyValue.key as string)) {
    if (typeof updatedKeyValue.value !== "number") {
      // Default to 0 if parsing fails
      updatedKeyValue = { ...updatedKeyValue, value: parseFloat(updatedKeyValue.value) || 0 };
    }
  }
  return { [updatedKeyValue.key]: updatedKeyValue.value };
}

export function getUpdateFromEvent(
  itemFormSchema: ZodTypeAny,
  event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
): object | undefined {
  return parseUpdate(itemFormSchema, getUpdatedKeyValueFromEvent(event));
}

export function getUpdateFromEdiTextField(
  itemFormSchema: ZodTypeAny,
  value?: string,
  inputProps?: InputProps,
): object | undefined {
  return parseUpdate(itemFormSchema, getUpdatedKeyValueFromEdiTextField(value, inputProps));
}
