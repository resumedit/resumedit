// @/types/itemDescendant.tsx

import { ItemOrderableClientStateType, ItemOrderableServerStateType } from "@/schemas/item";
import {
  ItemDescendantOrderableClientStateType,
  ItemDescendantOrderableServerStateType,
} from "@/schemas/itemDescendant";
import { PrismaClient } from "@prisma/client";

// Ensure the below is a tuple by adding `as const`
export const itemDescendantModelHierarchy = ["user", "resume", "organization", "role", "achievement"] as const;
export type ItemDescendantModelNameType = (typeof itemDescendantModelHierarchy)[number];

/**
 * Type representing each model's parent and its descendants in the hierarchy.
 */
export type ItemDescendantModelAccessor<T extends ItemOrderableClientStateType | ItemOrderableServerStateType> = {
  [K in ItemDescendantModelNameType]: {
    parent: ItemDescendantModelNameType | null;
    descendant: ItemDescendantModelNameType | null;
    orderField?: keyof ItemOrderableClientStateType;
    customSortFunction?: ItemOrderFunction<T>;
  };
};

/**
 * Creates a mapping of each model to its parent and its descendants.
 */
const baseItemDescendantModels: ItemDescendantModelAccessor<
  ItemOrderableClientStateType | ItemOrderableServerStateType
> = itemDescendantModelHierarchy.reduce(
  (acc, model, index, array) => {
    acc[model] = {
      parent: index === 0 ? null : array[index - 1],
      descendant: index < array.length - 1 ? array[index + 1] : null,
    };
    return acc;
  },
  {} as ItemDescendantModelAccessor<ItemOrderableClientStateType | ItemOrderableServerStateType>,
);

const itemDescendantModels: ItemDescendantModelAccessor<ItemOrderableClientStateType | ItemOrderableServerStateType> = {
  ...baseItemDescendantModels,
  /* Note: The implementation of the `Role` model requires a new type to be defined
  role: {
    ...baseItemDescendantModels.role, // Spread the existing 'role' properties
    // Define a custom sorting function for Role
    customSortFunction: (a: RoleItemClientStateType, b: RoleItemClientStateType) => {
      // Sort by begin date, then by end date if begin dates are equal
      // Assume 'Role' is a known type with 'period' property
      return (
        a.period.begin.getTime() - b.period.begin.getTime() ||
        (a.period.end?.getTime() ?? 0) - (b.period.end?.getTime() ?? 0)
      );
    },
  },
  */
  achievement: {
    ...baseItemDescendantModels.achievement,
    orderField: "order",
  },
};

export type ItemOrderFunction<
  T extends
    | ItemDescendantOrderableClientStateType
    | ItemOrderableClientStateType
    | ItemDescendantOrderableServerStateType
    | ItemOrderableServerStateType,
> = (a: T, b: T) => number;
export function getItemOrderFunction<T extends ItemOrderableClientStateType | ItemOrderableServerStateType>(
  model: ItemDescendantModelNameType,
): ItemOrderFunction<T> | undefined {
  const entry = itemDescendantModels[model];
  if (entry.customSortFunction) {
    // The customSortFunction should be defined as ItemOrderFunction<T> in the ItemModelAccessor
    return entry.customSortFunction as ItemOrderFunction<T>;
  } else if (entry.orderField) {
    return (a, b) => {
      const fieldA = a[entry.orderField as keyof T];
      const fieldB = b[entry.orderField as keyof T];
      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return fieldA - fieldB;
      }
      // Handle the case where fieldA or fieldB is not a number, or return a default value
      return 0;
    };
  }
  return undefined;
}

/**
 * Retrieves the parent of a given model from the hierarchy.
 * @param model - The model whose parent is to be found.
 * @returns The parent model or null if it's the top-level model.
 */
export function getParentModel(model: ItemDescendantModelNameType): ItemDescendantModelNameType | null {
  // return itemDescendantModels[model]?.parent || null;
  const entry = itemDescendantModels[model];
  if (entry) {
    return entry.parent;
  }
  return null;
}

/**
 * Retrieves the descendant of a given model from the hierarchy.
 * @param model - The model whose descendant is to be found.
 * @returns The descendant model or null if it's the bottom-level model.
 */
export function getDescendantModel(model: ItemDescendantModelNameType): ItemDescendantModelNameType | null {
  const entry = itemDescendantModels[model];
  if (entry) {
    return entry.descendant;
  }
  return null;
}

// Define a type that maps model names to Prisma model method types
// Define types for Prisma model methods
type PrismaModelMethodType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findUnique: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany: (args: any) => Promise<any>;
};

export type PrismaModelMethods = {
  [K in ItemDescendantModelNameType]: PrismaModelMethodType;
};

export function getModelAccessor(model: ItemDescendantModelNameType, prisma: PrismaClient): PrismaModelMethodType {
  // This function dynamically accesses the prisma model methods based on the model name
  // The as PrismaModelMethodType cast is safe as long as PrismaClient's API remains consistent with PrismaModelMethodType
  return prisma[model] as unknown as PrismaModelMethodType; // Adjust as needed for your Prisma setup
}
