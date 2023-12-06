// @/actions/nestedItem.ts

"use server";

import { prisma } from "@/prisma/client";
import { IdSchemaType } from "@/schemas/id";
import { ItemServerStateType } from "@/types/item";
import { NestedItemListType, NestedItemModelNameType, getDescendantModel, getModelAccessor } from "@/types/nestedItem";
import { PrismaClient } from "@prisma/client";

export async function getItem(model: NestedItemModelNameType, id: IdSchemaType, prismaTransaction?: PrismaClient) {
  const prismaClient = prismaTransaction || prisma;
  const prismaModelInstance = getModelAccessor(model, prismaClient);
  const item = await prismaModelInstance.findUnique({
    where: { id },
  });
  return item;
}

export async function getItemLastModified(
  model: NestedItemModelNameType,
  id: IdSchemaType,
  prismaTransaction?: PrismaClient,
) {
  const prismaClient = prismaTransaction || prisma;
  const prismaParentModelInstance = getModelAccessor(model, prismaClient);
  const item = await prismaParentModelInstance.findUnique({
    where: { id },
    select: { lastModified: true },
  });
  return item?.lastModified;
}

export async function getItemsByParentId(
  model: NestedItemModelNameType,
  parentId: IdSchemaType,
  prismaTransaction?: PrismaClient,
): Promise<ItemServerStateType[]> {
  const prismaClient = prismaTransaction || prisma;
  const prismaItemModelInstance = getModelAccessor(model, prismaClient);
  // Retrieve the items
  const items = await prismaItemModelInstance.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
  });

  return items;
}

export async function getNestedItemList(
  itemModel: NestedItemModelNameType,
  itemId: IdSchemaType,
  prismaTransaction?: PrismaClient,
): Promise<NestedItemListType<ItemServerStateType, ItemServerStateType>> {
  const executeLogic = async (prismaClient: PrismaClient) => {
    const item = await getItem(itemModel, itemId, prisma);
    if (!item) {
      throw Error(`getNestedItemList: No ${itemModel} instance with id=${itemId} found`);
    }
    let descendants: Array<NestedItemListType<ItemServerStateType, ItemServerStateType>> = [];

    // Fetch the items that are direct descendants of the item
    const itemDescendantModel = getDescendantModel(itemModel);

    if (itemDescendantModel) {
      const itemDescendants = await getItemsByParentId(itemDescendantModel, itemId, prismaClient);

      // For each item, fetch its descendants recursively
      if (itemDescendants && itemDescendants.length > 0) {
        console.log(`${itemModel} ${itemId} has ${itemDescendants.length} descendants`);
        const descendantModel = getDescendantModel(itemModel);
        if (descendantModel) {
          descendants = await Promise.all(
            itemDescendants.map((item) => getNestedItemList(descendantModel, item.id, prismaClient)),
          );
        }
      }
    } else {
      console.log(`${itemModel} ${itemId}: no descendants found`);
    }

    // Construct the NestedItemListType for the current itemModel and itemId
    return {
      ...item,
      itemModel: itemModel,
      descendants,
    };
  };

  // Use provided transaction or create a new one
  return prismaTransaction
    ? executeLogic(prismaTransaction)
    : prisma.$transaction(async (prismaClient) => executeLogic(prismaClient as unknown as PrismaClient));
}

// Recursive function to soft delete an item and all its descendants
export async function softDeleteAndCascadeItem(
  model: NestedItemModelNameType,
  itemId: string,
  prismaTransaction?: PrismaClient,
): Promise<void> {
  const executeLogic = async (prismaClient: PrismaClient) => {
    const now = new Date();
    const modelAccessor = getModelAccessor(model, prismaClient);

    // Soft delete the specified item
    await modelAccessor.update({
      where: { id: itemId },
      data: { deletedAt: now },
    });

    // Recursively soft delete all descendant items
    const itemModel = getDescendantModel(model);
    if (itemModel) {
      const itemModelAccessor = getModelAccessor(itemModel, prismaClient);
      const itemsToDelete = await itemModelAccessor.findMany({
        where: { parentId: itemId, deletedAt: null },
      });

      for (const item of itemsToDelete) {
        await softDeleteAndCascadeItem(itemModel, item.id, prismaClient);
      }
    }
  };

  // Use the provided transaction or create a new one if none was provided
  if (prismaTransaction) {
    await executeLogic(prismaTransaction);
  } else {
    await prisma.$transaction(async (prismaClient) => {
      await executeLogic(prismaClient as unknown as PrismaClient);
    });
  }
}
