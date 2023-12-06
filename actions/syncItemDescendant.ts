// @/actions/syncItemDescendant.ts

"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { UserInputType } from "@/schemas/user";
import {
  ItemDescendantClientStateType,
  ItemDescendantServerStateType,
  ItemDescendantStore,
  ItemServerStateDescendantListType,
} from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemClientStateType, ItemClientToServerType, ItemServerStateType } from "@/types/item";
import { getModelAccessor, keepOnlyFieldsForCreate, keepOnlyFieldsForUpdate } from "@/types/itemDescendant";
import { Prisma, PrismaClient } from "@prisma/client";
import { getItemDescendantList, getItemsByParentId, softDeleteAndCascadeItem } from "./itemDescendant";

export async function handleNestedItemDescendantListFromClient(
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
): Promise<ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType> | null> {
  // Take the time
  const currentTimestamp = new Date();

  // Start the transaction
  return prisma.$transaction(async (prismaTransaction) => {
    return processItemDescendantRecursively(item, prismaTransaction as PrismaClient, currentTimestamp);
  });
}
async function processItemDescendantRecursively(
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  prismaTransaction: PrismaClient,
  currentTimestamp: Date,
): Promise<ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType> | null> {
  // Process the item itself
  const itemResult = await processItemDescendant(item, prismaTransaction, currentTimestamp);
  console.log(`handleNestedItemDescendantListFromClient: item.itemModel=${item.itemModel} itemResult`, itemResult);
  if (itemResult === null || item.descendants.length === 0) {
    return itemResult;
  }

  // Process each descendant
  for (const descendant of item.descendants) {
    const descendantResult = await processItemDescendantRecursively(descendant, prismaTransaction, currentTimestamp);
    console.log(
      `handleNestedItemDescendantListFromClient: descendant.itemModel=${descendant.itemModel}: descendantResult`,
      descendantResult,
    );
    // Update the descendant list in itemResult with the processed descendants
    if (descendantResult !== null) {
      itemResult.descendants = itemResult.descendants.map((d) => (d.id === descendantResult.id ? descendantResult : d));
    }
  }

  return itemResult;
}

async function processItemDescendant(
  clientItem: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  prismaTransaction: PrismaClient,
  currentTimestamp: Date,
): Promise<ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType> | null> {
  const itemModel = clientItem.itemModel;

  // Ensure that the client's lastModified timestamp is less recent than currentTimestamp
  const clientLastModified =
    clientItem.lastModified < currentTimestamp
      ? clientItem.lastModified
      : new Date(currentTimestamp.getMilliseconds() - 1);

  if (clientItem.id) {
    const existingClientItem = {
      ...clientItem,
      id: clientItem.id!,
      parentId: clientItem.parentId!,
    };
    const id = existingClientItem.id!;

    // const serverLastModifiedDb = await getItemLastModified(itemModel, id);
    const prismaItemModelInstance = getModelAccessor(itemModel, prismaTransaction);
    const serverItem = await prismaItemModelInstance.findUnique({
      where: { id },
      select: { lastModified: true },
    });
    const serverLastModifiedDb = serverItem?.lastModified;

    // Ensure that the server's lastModified timestamp is more recent than that of the client if both were invalid
    const serverLastModified =
      serverLastModifiedDb && serverLastModifiedDb < currentTimestamp ? serverLastModifiedDb : currentTimestamp;

    // Process logic only if the client state is more recent
    if (clientLastModified > serverLastModified) {
      console.log(
        `processItemDescendant: itemModel=${itemModel}: clientLastModified=${dateToISOLocal(
          clientLastModified,
        )} > ${dateToISOLocal(serverLastModified)}=serverLastModified`,
      );

      const updatedItemDescendantState: ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType> =
        await mergeItemDescendant(existingClientItem, prismaTransaction, serverLastModified, currentTimestamp);
      return updatedItemDescendantState;
    } else if (clientLastModified < serverLastModified) {
      const serverItem = getItemDescendantList(itemModel, existingClientItem.id!) as Promise<
        ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType>
      >;
      return serverItem;
    } else {
      // Same lastModified timestamp implies no differences below this item
      return null;
    }
  } else {
    // Create item
    const parentId = clientItem.parentId!;
    const data = keepOnlyFieldsForUpdate<ItemClientToServerType>({ ...clientItem, parentId }, clientLastModified);
    console.log(`processItemDescendant: parentId=${parentId}: create item with data:`, data);
    const prismaItemModelInstance = getModelAccessor(itemModel, prismaTransaction);
    console.log(`processItemDescendant: ${itemModel}.create:`, data);

    return await prismaItemModelInstance.create({
      data,
    });
  }
}

async function mergeItemDescendant(
  existingClientItem: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  prismaTransaction: PrismaClient,
  serverLastModified: Date,
  currentTimestamp: Date,
): Promise<ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType>> {
  const id = existingClientItem.id!;
  const clientLastModified = existingClientItem.lastModified;
  const itemModel = existingClientItem.itemModel;
  const descendantModel = existingClientItem.descendantModel;

  let clientIsUpToDate = true;

  // Detect if the client has any descendants not present on the server
  let ghostItemsDetected = 0;

  // Track descendants from client whose `lastModified` timestamp
  // is invalid or older than the one of the server
  let clientItemsStaleOrInvalid = 0;

  // Track descendants created on the server
  let serverItemsCreated = 0;

  // Track descendants deleted on the server to indicate to the client
  // that it can remove those as well
  let serverItemsDeleted = 0;

  // Incorporate all changes from the client into the server's state
  const clientDescendants = existingClientItem.descendants;

  // The descendants covered by the client are set to the clientLastModified timestamp
  const lastModified = clientLastModified;

  // Process both the properties of the current item and its descendants
  const prismaItemModelInstance = getModelAccessor(itemModel, prisma as PrismaClient);

  // The `User` model requires special treatment
  if (itemModel === "user") {
    const { id, email, firstName, lastName } = existingClientItem as unknown as UserInputType;
    const data = { id, email, firstName, lastName };
    console.log(`mergeItemDescendant: ${itemModel}.update:`, {
      where: { id },
      data,
    });
    await prismaItemModelInstance.update({
      where: { id },
      data,
    });
  } else {
    // Update current item properties
    console.log(`processItemDescendant: ${itemModel}.update:`, {
      where: { id },
      data: keepOnlyFieldsForUpdate<ItemClientToServerType>(existingClientItem, currentTimestamp),
    });
    await prismaItemModelInstance.update({
      where: { id },
      data: keepOnlyFieldsForUpdate<ItemClientToServerType>(existingClientItem, currentTimestamp),
    });
  }
  let descendantsAfterUpdate = clientDescendants as ItemServerStateDescendantListType<
    ItemServerStateType,
    ItemServerStateType
  >;
  let descendantsCreatedByThisClient: ItemServerStateDescendantListType<ItemServerStateType, ItemServerStateType> = [];

  if (descendantModel) {
    const prismaDescendantModelInstance = getModelAccessor(descendantModel, prismaTransaction);
    // Process each descendant for update or creation
    const descendantPromises = clientDescendants.map(
      async (descendant: ItemClientStateType | ItemDescendantStore<ItemClientStateType, ItemClientStateType>) => {
        const descendantWithParentId = { ...descendant, parentId: id };
        try {
          if (descendant.id) {
            // Only apply client data if it is more recent than the database
            // const serverModified = await getItemLastModified(descendantModel, descendant.id);
            const serverDescendant = await prismaDescendantModelInstance.findUnique({
              where: { id: descendant.id },
              select: { lastModified: true },
            });
            const serverModified = serverDescendant?.lastModified;

            // Update or soft delete existing descendant if this deletion happened later than the last modification
            if (
              descendant.deletedAt &&
              descendant.deletedAt instanceof Date &&
              descendant.lastModified &&
              descendant.lastModified instanceof Date &&
              descendant.deletedAt >= descendant.lastModified &&
              (!serverModified || descendant.deletedAt > serverModified)
            ) {
              console.log(`Soft deleting and cascading descendant with id=${descendant.id}`);
              await softDeleteAndCascadeItem(descendantModel, descendant.id, prismaTransaction);
              ++serverItemsDeleted;
            } else {
              // Only consider client data if its timestamp looks sane
              if (descendant.lastModified && descendant.lastModified instanceof Date) {
                if (!serverModified || descendant.lastModified > serverModified) {
                  const data = keepOnlyFieldsForUpdate<ItemClientToServerType>(descendantWithParentId, lastModified);
                  console.log(
                    `mergeItemDescendant: descendant.id=${descendant.id}: update descendant with data:`,
                    data,
                  );
                  return await prismaDescendantModelInstance.update({
                    where: { id: descendant.id },
                    data,
                  });
                } else {
                  ++clientItemsStaleOrInvalid;
                }
              } else {
                console.log(
                  `mergeItemDescendant: descendant.id=${descendant.id}: invalid lastModified timestamp:`,
                  descendant.lastModified,
                );
                ++clientItemsStaleOrInvalid;
              }
            }
          } else {
            const data = keepOnlyFieldsForCreate<ItemClientToServerType>(descendantWithParentId, id, lastModified);
            console.log(`mergeItemDescendant: ${descendantModel}.create:`, data);
            const createdItem = await prismaDescendantModelInstance.create({
              data,
            });
            ++serverItemsCreated;
            const clientResponseItem = { ...createdItem, clientId: descendantWithParentId.clientId };
            console.log(`mergeItemDescendant: appending to descendantsCreatedByThisClient:`, clientResponseItem);
            descendantsCreatedByThisClient = [...descendantsCreatedByThisClient, clientResponseItem];
            return createdItem;
          }
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            // Ignore not found error
            console.log(`Item with id ${descendant.id} not found. Ignoring update.`);
            ++ghostItemsDetected;
          } else {
            throw error; // Re-throw other errors
          }
        }
      },
    );

    await Promise.all(descendantPromises);

    // Fetch updated descendants to ensure we include only existing ones
    descendantsAfterUpdate = (await getItemsByParentId(
      descendantModel,
      id,
      prismaTransaction,
    )) as ItemServerStateDescendantListType<ItemServerStateType, ItemServerStateType>;

    // Replace the descendants created by the client to include the clientId
    descendantsAfterUpdate = descendantsAfterUpdate.map((descendant) => {
      return descendantsCreatedByThisClient.find((newDescendant) => newDescendant.id === descendant.id) || descendant;
    });

    console.log(
      `mergeItemDescendant: client update with clientLastModified=${dateToISOLocal(
        clientLastModified,
      )} applied:\n${clientDescendants
        .map((a: ItemClientStateType) => a.id?.substring(0, 8))
        .join(", ")}\n.findMany returned ${descendantsAfterUpdate.length} descendants:\n${descendantsAfterUpdate
        .map((a: ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType>) => a.id?.substring(0, 8))
        .join(", ")}\n`,
    );

    let clientDescendantsComplete = true;
    const serverDescendantsUnmodified =
      ghostItemsDetected == 0 && clientItemsStaleOrInvalid == 0 && serverItemsCreated == 0 && serverItemsDeleted == 0;

    // Only if no changes have been made to the server state do we need to check if
    // the list of descendants from the client contained all the descendants on the server
    if (serverDescendantsUnmodified) {
      // Compare server descendants with client descendants
      const clientItemIds = new Set(clientDescendants.map((a) => a.id));
      clientDescendantsComplete = descendantsAfterUpdate.every(
        (serverItem: ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType>) =>
          clientItemIds.has(serverItem.id),
      );
    }

    // Determine if the client is up to date
    clientIsUpToDate = serverDescendantsUnmodified && clientDescendantsComplete;
  }

  // Assign the final timestamp to that of the client if the client is up to data
  // Otherwise, use the current time to update both server and client lastModified timestamp
  const finalLastModified = clientIsUpToDate ? clientLastModified : currentTimestamp;

  if (clientIsUpToDate) {
    console.log(
      "mergeItemDescendant: server updated to match client state:\n",
      `update item ${itemModel} lastModified from ${dateToISOLocal(
        serverLastModified,
      )} to clientLastModified=${dateToISOLocal(finalLastModified)}`,
    );
  } else {
    console.log(
      "mergeItemDescendant: server and client state merged:\n",
      `update item ${itemModel} lastModified from ${dateToISOLocal(
        serverLastModified,
      )} to currentTimestamp=${dateToISOLocal(finalLastModified)}`,
    );
  }

  // Update the lastModified timestamp of the item
  await prismaItemModelInstance.update({
    where: { id: id },
    data: { lastModified: finalLastModified },
  });

  const mergedItemDescendant = {
    ...existingClientItem,
    lastModified: finalLastModified,
    descendants: descendantsAfterUpdate,
  } as ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType>;
  return mergedItemDescendant;
}
