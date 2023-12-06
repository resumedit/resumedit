// @/actions/syncItemDescendant.ts

"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import {
  ItemDescendantServerStateType,
  itemDescendantServerStateSchema,
  itemDescendantServerToClientSchema,
} from "@/schemas/itemDescendant";
import { UserInputType } from "@/schemas/user";
import { ItemDescendantClientStateType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemClientStateType, ItemClientToServerType } from "@/types/item";
import {
  ItemDescendantModelNameType,
  PrismaModelMethods,
  getItemDataForCreate,
  getItemDataForUpdate,
  getModelAccessor,
} from "@/types/itemDescendant";
import { PrismaClient } from "@prisma/client";

export async function handleNestedItemDescendantListFromClient(
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
): Promise<ItemDescendantServerStateType | Date> {
  // Capture the result to respond to the client
  let response = null;

  // Take the time
  const currentTimestamp = new Date();

  // Start the transaction
  response = await prisma.$transaction(async (prismaTransaction) => {
    return processItemRecursively(item, currentTimestamp, prismaTransaction as PrismaClient);
  });

  if (response) {
    // Enssure the response corresponds to the schema
    itemDescendantServerToClientSchema.parse(response);
  }

  return response || item.lastModified;
}

async function processItemRecursively(
  clientItem: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  currentTimestamp: Date,
  prismaTransaction: PrismaClient,
): Promise<ItemDescendantServerStateType | null> {
  // Process the item itself
  const serverItem = await processItem(clientItem, prismaTransaction, currentTimestamp);

  if (serverItem === null || clientItem.descendants.length === 0) {
    console.log(`processItemRecursively: item.itemModel=${clientItem.itemModel}: returning serverItem`, serverItem);
    return serverItem;
  }

  // Accumulate updates for each descendant
  // Pass along the item's `id` for the case where the descendant has just been created on the server
  // and the descendants from the client do not contain the parentId yet
  const updatedDescendants: Array<ItemDescendantServerStateType> = [];
  for (const descendant of clientItem.descendants) {
    const descendantResult = await processItemRecursively(
      { ...descendant, parentId: serverItem.id },
      currentTimestamp,
      prismaTransaction,
    );
    console.log(
      `processItemRecursively: descendant.itemModel=${descendant.itemModel}: descendantResult`,
      descendantResult,
    );
    if (descendantResult !== null) {
      updatedDescendants.push(descendantResult);
    }
  }

  // Apply accumulated updates to the item's descendant array
  if (serverItem.descendants) {
    serverItem.descendants = serverItem.descendants.map(
      (d: ItemDescendantServerStateType) => updatedDescendants.find((ud) => ud.id === d.id) ?? d,
    );
  }
  console.log(`processItemRecursively: item.itemModel=${clientItem.itemModel}: returning serverItem`, serverItem);
  if (serverItem !== null) {
    itemDescendantServerStateSchema.parse(serverItem);
  }
  return serverItem;
}

async function processItem(
  clientItem: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  prismaTransaction: PrismaClient,
  currentTimestamp: Date,
): Promise<ItemDescendantServerStateType | null> {
  if (!clientItem.itemModel || !clientItem.parentId) {
    throw Error(
      `processItem: itemModel=${clientItem.itemModel} parentId=${clientItem.parentId} with clientItem: ${JSON.stringify(
        clientItem,
      )}`,
    );
  }
  let serverItem = null;

  const itemModel = clientItem.itemModel;
  const parentId = clientItem.parentId;

  // Ensure that the client's lastModified timestamp is less recent than currentTimestamp
  const clientLastModified =
    clientItem.lastModified < currentTimestamp
      ? clientItem.lastModified
      : new Date(currentTimestamp.getMilliseconds() - 1);

  const prismaItemModelInstance = getModelAccessor(itemModel, prismaTransaction);

  if (clientItem.id) {
    const existingClientItem = {
      ...clientItem,
      id: clientItem.id!,
      parentId: clientItem.parentId!,
    };
    const id = existingClientItem.id!;

    // const serverLastModifiedDb = await getItemLastModified(itemModel, id);
    serverItem = await prismaItemModelInstance.findUnique({
      where: { id },
    });
    const serverLastModifiedDb = serverItem?.lastModified;

    // Ensure that the server's lastModified timestamp is more recent than that of the client if both were invalid
    const serverLastModified =
      serverLastModifiedDb && serverLastModifiedDb < currentTimestamp ? serverLastModifiedDb : currentTimestamp;

    // Process logic only if the client state is more recent
    if (clientLastModified > serverLastModified) {
      console.log(
        `processItem ${itemModel} MERGE: item exists but clientLastModified=${dateToISOLocal(
          clientLastModified,
        )} > ${dateToISOLocal(serverLastModified)}=serverLastModified`,
      );
      serverItem = await mergeItem(existingClientItem, serverLastModified, currentTimestamp, prismaItemModelInstance);
    } else if (clientLastModified < serverLastModified) {
      // Same lastModified timestamp implies no differences below this item
      console.log(
        `processItem ${itemModel}: NOOP: item exists and clientLastModified=${dateToISOLocal(
          clientLastModified,
        )} == ${dateToISOLocal(serverLastModified)}=serverLastModified`,
      );
    } else {
      // Same lastModified timestamp implies no differences below this item
      console.log(
        `processItem ${itemModel}: NOOP: item exists and clientLastModified=${dateToISOLocal(
          clientLastModified,
        )} == ${dateToISOLocal(serverLastModified)}=serverLastModified`,
      );
      serverItem = null;
    }
  } else {
    // Create item
    const data = getItemDataForCreate<ItemClientToServerType>(clientItem, parentId, clientLastModified);
    console.log(`processItem ${itemModel}: CREATE `, "\n", clientItem);
    console.log(`processItem ${itemModel}.create:`, "\n", data);

    serverItem = await prismaItemModelInstance.create({
      data,
    });
  }
  console.log(`processItem ${itemModel}: return serverItem:`, serverItem);
  if (serverItem !== null) {
    itemDescendantServerStateSchema.parse(serverItem);
  }
  return serverItem;
}

async function mergeItem(
  clientItem: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  serverLastModified: Date,
  currentTimestamp: Date,
  prismaItemModelInstance: PrismaModelMethods[ItemDescendantModelNameType],
): Promise<ItemDescendantServerStateType | Date> {
  if (!clientItem.itemModel || !clientItem.parentId) {
    throw Error(
      `mergeItem: itemModel=${clientItem.itemModel} parentId=${clientItem.parentId} with clientItem: ${JSON.stringify(
        clientItem,
      )}`,
    );
  }

  // Determine if the client needs to apply any changes detected on the server
  const clientIsUpToDate = true;

  const id = clientItem.id!;
  const clientLastModified = clientItem.lastModified;
  const itemModel = clientItem.itemModel;

  // The best case scenario is that the client was the only one to have made changes
  // In this case, we return only the `lastModified` timestamp of the client
  // to indicate that all modifications up to this point in time have been
  // applied by the server and there is nothing more recent to be aware of
  let serverItem = clientLastModified;

  // The `User` model requires special treatment
  if (itemModel === "user") {
    const { id, email, firstName, lastName } = clientItem as unknown as UserInputType;
    const data = { id, email, firstName, lastName };
    console.log(`mergeItem: ${itemModel}.update:`, {
      where: { id },
      data,
    });
    await prismaItemModelInstance.update({
      where: { id },
      data,
    });
  } else {
    // Update current item properties
    console.log(`mergeItem: ${itemModel}.update:`, {
      where: { id },
      data: getItemDataForUpdate<ItemClientToServerType>(clientItem, currentTimestamp),
    });
    await prismaItemModelInstance.update({
      where: { id },
      data: getItemDataForUpdate<ItemClientToServerType>(clientItem, currentTimestamp),
    });
  }

  // Assign the final timestamp to that of the client if the client is up to data
  // Otherwise, use the current time to update both server and client lastModified timestamp
  const finalLastModified = clientIsUpToDate ? clientLastModified : currentTimestamp;

  if (clientIsUpToDate) {
    console.log(
      `mergeItem ${itemModel}: SERVER UPDATED`,
      "\n",
      `update item ${itemModel} lastModified from ${dateToISOLocal(
        serverLastModified,
      )} to clientLastModified=${dateToISOLocal(finalLastModified)}`,
    );
  } else {
    console.log(
      `mergeItem ${itemModel}: MERGED`,
      "\n",
      `update item ${itemModel} lastModified from ${dateToISOLocal(
        serverLastModified,
      )} to currentTimestamp=${dateToISOLocal(finalLastModified)}`,
    );
  }

  // Update the lastModified timestamp of the item
  serverItem = await prismaItemModelInstance.update({
    where: { id: id },
    data: { lastModified: finalLastModified },
  });

  // const mergedItemDescendant = {
  //   ...clientItem,
  //   lastModified: finalLastModified,
  //   descendants: [],
  // } as ItemDescendantServerStateType;
  // return mergedItemDescendant;

  if (!(serverItem instanceof Date)) {
    itemDescendantServerStateSchema.parse(serverItem);
  }
  return serverItem;
}

/*
async function applyClientDescendantListToServer(
  existingClientItem: ItemDescendantServerStateType,
  prismaTransaction: PrismaClient,
): Promise<Array<ItemDescendantServerToClientType<ItemServerToClientType, ItemServerToClientType>> | null> {
  // Determine if the client needs to apply any changes detected on the server
  let clientIsUpToDate = true;

  const descendantModel = existingClientItem.descendantModel;

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

  // Id of parent item
  const id = existingClientItem.id;

  // Incorporate all changes from the client into the server's state
  const clientDescendants = existingClientItem.descendants;

  // The descendants covered by the client are set to the parent item's timestamp
  const clientLastModified = existingClientItem.lastModified;

  // Process both the properties of the current item and its descendants

  let descendantsAfterUpdate: Array<ItemDescendantServerToClientType<ItemServerToClientType, ItemServerToClientType>> =
    [];
  let descendantsCreatedByThisClient: Array<
    ItemDescendantServerToClientType<ItemServerToClientType, ItemServerToClientType>
  > = [];

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
                  const data = getItemDataForUpdate<ItemClientToServerType>(descendantWithParentId, clientLastModified);
                  console.log(
                    `applyClientDescendantListToServer: descendant.id=${descendant.id}: update descendant with data:`,
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
                  `applyClientDescendantListToServer: descendant.id=${descendant.id}: invalid lastModified timestamp:`,
                  descendant.lastModified,
                );
                ++clientItemsStaleOrInvalid;
              }
            }
          } else {
            const data = keepOnlyFieldsForCreate<ItemClientToServerType>(
              descendantWithParentId,
              id,
              clientLastModified,
            );
            console.log(`applyClientDescendantListToServer: ${descendantModel}.create:`, data);
            const createdItem = await prismaDescendantModelInstance.create({
              data,
            });
            ++serverItemsCreated;
            const clientResponseItem = { ...createdItem, clientId: descendantWithParentId.clientId };
            console.log(`applyClientDescendantListToServer: appending to descendantsCreatedByThisClient:`, clientResponseItem);
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
      `applyClientDescendantListToServer: client update with clientLastModified=${dateToISOLocal(
        clientLastModified,
      )} applied:\n${clientDescendants
        .map((a: ItemClientStateType) => a.id?.substring(0, 8))
        .join(", ")}\n.findMany returned ${descendantsAfterUpdate.length} descendants:\n${descendantsAfterUpdate
        .map(
          (a: ItemDescendantServerToClientType<ItemServerToClientType, ItemServerToClientType>) =>
            a.id?.substring(0, 8),
        )
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
        (serverItem: ItemDescendantServerToClientType<ItemServerToClientType, ItemServerToClientType>) =>
          clientItemIds.has(serverItem.id),
      );
    }

    // Determine if the client is up to date
    clientIsUpToDate = serverDescendantsUnmodified && clientDescendantsComplete;
  }
  return clientIsUpToDate ? null : descendantsAfterUpdate;
}
*/
