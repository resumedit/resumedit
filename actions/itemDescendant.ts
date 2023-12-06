// @/actions/itemDescendant.ts

"use server";

import { prisma } from "@/prisma/client";
import { IdSchemaType, idDefault, isValidItemId } from "@/schemas/id";
import { ItemDescendantServerOutputType, ItemDescendantServerStateListType } from "@/schemas/itemDescendant";
import {
  ItemDescendantModelNameType,
  getDescendantModel,
  getModelAccessor,
  itemDescendantModelHierarchy,
} from "@/types/itemDescendant";
import { PrismaClient } from "@prisma/client";

export async function getItem(model: ItemDescendantModelNameType, id: IdSchemaType, prismaTransaction?: PrismaClient) {
  const prismaClient = prismaTransaction ?? prisma;
  const prismaModelInstance = getModelAccessor(model, prismaClient);
  let item = await prismaModelInstance.findUnique({
    where: { id },
  });
  // Since the top-most model does not have a parent, we initialize to the default id
  if (!item.parentId && model === itemDescendantModelHierarchy[0]) {
    item = { ...item, parentId: idDefault };
  }

  return item;
}

export async function getItemLastModified(
  model: ItemDescendantModelNameType,
  id: IdSchemaType,
  prismaTransaction?: PrismaClient,
): Promise<Date | undefined> {
  const prismaClient = prismaTransaction ?? prisma;
  const prismaModelInstance = getModelAccessor(model, prismaClient);
  const item = await prismaModelInstance.findUnique({
    where: { id },
    select: { lastModified: true },
  });
  return item?.lastModified;
}

export async function getItemsByParentId(
  model: ItemDescendantModelNameType,
  parentId: IdSchemaType,
  prismaTransaction?: PrismaClient,
): Promise<ItemDescendantServerStateListType> {
  const prismaClient = prismaTransaction ?? prisma;
  const prismaItemModelInstance = getModelAccessor(model, prismaClient);
  // Retrieve the items
  const items = await prismaItemModelInstance.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
  });

  return items;
}

export async function getItemDescendantList(
  itemModel: ItemDescendantModelNameType,
  itemId: IdSchemaType,
  prismaTransaction?: PrismaClient,
): Promise<ItemDescendantServerOutputType> {
  const executeLogic = async (prismaClient: PrismaClient) => {
    const logPrefix = `getItemDescendantList(itemModel=${itemModel}, itemId=${itemId})`;
    if (!isValidItemId(itemId)) {
      throw Error(logPrefix + `: for ${itemModel} the provided itemId="${itemId}" is not valid`);
    }
    let item = await getItem(itemModel, itemId, prisma);
    if (!item) {
      throw Error(logPrefix + `: no ${itemModel} instance with id=${itemId} found`);
    }
    // Since the top-most model does not have a parent, we initialize to the default id
    if (!item.parentId && itemModel === itemDescendantModelHierarchy[0]) {
      item = { ...item, parentId: idDefault };
    }
    let descendants: Array<ItemDescendantServerOutputType> = [];

    // Fetch the items that are direct descendants of the item
    const descendantModel = getDescendantModel(itemModel);

    if (descendantModel) {
      const itemDescendants = await getItemsByParentId(descendantModel, itemId, prismaClient);

      // For each item, fetch its descendants recursively
      if (itemDescendants && itemDescendants.length > 0) {
        console.log(
          `${logPrefix}: returning ${itemDescendants.length}`,
          itemDescendants.length != 1 ? "descendants: " : "descendant: ",
          itemDescendants,
        );
        const descendantModel = getDescendantModel(itemModel);
        if (descendantModel) {
          descendants = await Promise.all(
            itemDescendants.map((item) => getItemDescendantList(descendantModel, item.id, prismaClient)),
          );
        }
      }
    }

    // Construct the ItemDescendantServerOutputType for the current itemModel and itemId
    return {
      ...item,
      itemModel,
      descendantModel,
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
  model: ItemDescendantModelNameType,
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
