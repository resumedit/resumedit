"use server";

import { prisma } from "@/prisma/client";
import { IdSchemaType } from "@/schemas/id";
import { ParentItemListStoreNameType, getItemModel, getModelAccessor, getParentModel } from "@/types/parentItemList";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";

export async function getItem(model: ParentItemListStoreNameType, id: IdSchemaType, prismaTransaction?: PrismaClient) {
  const prismaClient = prismaTransaction || prisma;
  const prismaModelInstance = getModelAccessor(model, prismaClient);
  const item = await prismaModelInstance.findUnique({
    where: { id },
  });
  return item;
}

export async function getItemLastModified(
  model: ParentItemListStoreNameType,
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

export async function getItemList(
  model: ParentItemListStoreNameType,
  parentId: IdSchemaType,
  prismaTransaction?: PrismaClient,
) {
  const prismaClient = prismaTransaction || prisma;
  const prismaItemModelInstance = getModelAccessor(model, prismaClient);
  // Retrieve the items
  const items = await prismaItemModelInstance.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
  });

  return items;
}

export async function getParentItemList(
  model: ParentItemListStoreNameType,
  parentId: IdSchemaType,
  prismaTransaction?: PrismaClient,
) {
  const parentModel = getParentModel(model);

  if (!parentModel) {
    throw Error(`getParentList(model=${model}, parentId=${parentId}): no parent model for ${model}`);
  }

  // Function to execute the logic, using either an existing transaction or a new prisma client
  const executeLogic = async (prismaClient: PrismaClient) => {
    const parent = await getItem(parentModel, parentId, prismaClient);

    if (!parent) {
      if (process.env.NODE_ENV === "development") {
        throw new Error(`${parentModel} with ID ${parentId} not found.`);
      } else {
        notFound();
      }
    }

    const items = await getItemList(model, parentId, prismaClient);

    return {
      parent,
      items,
    };
  };

  // If a transaction is provided, use it directly without starting a new transaction
  if (prismaTransaction) {
    return executeLogic(prismaTransaction);
  } else {
    // If no transaction is provided, start a new one
    return prisma.$transaction(async (prismaClient) => {
      // In Prisma, when you initiate a transaction using prisma.$transaction, the argument it provides
      // to the callback is not a full PrismaClient instance. It's a subset of PrismaClient with
      // certain methods omitted, specifically the ones related to managing the connection and
      // transactions themselves. As Prisma does not provide the types for a clean solution,
      //  we cast the limited client returned in the argument into a PrismaClient
      return executeLogic(prismaClient as unknown as PrismaClient);
    });
  }
}

// Recursive function to soft delete an item and all its descendants
export async function softDeleteAndCascadeItem(
  model: ParentItemListStoreNameType,
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
    const itemModel = getItemModel(model);
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
