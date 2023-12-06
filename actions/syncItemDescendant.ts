// @/actions/syncItemDescendant.ts

"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import {
  ItemClientStateType,
  ItemClientToServerType,
  ItemOutputType,
  ItemServerStateType,
  itemServerStateSchema,
} from "@/schemas/item";
import {
  ItemDescendantClientStateType,
  ItemDescendantServerStateType,
  itemDescendantServerStateSchema,
  itemDescendantServerToClientSchema,
} from "@/schemas/itemDescendant";
import {
  ItemDescendantModelNameType,
  PrismaModelMethods,
  getItemDataForCreate,
  getItemDataForUpdate,
  getModelAccessor,
} from "@/types/itemDescendant";
import { PrismaClient } from "@prisma/client";

export async function handleNestedItemDescendantListFromClient(
  clientItem: ItemDescendantClientStateType,
): Promise<ItemDescendantServerStateType | Date | null> {
  // Take the time
  const currentTimestamp = new Date();

  console.log(`handleNestedItemDescendantListFromClient: clientItem`, clientItem);

  // Process the entire update in a transaction and capture the result to respond to the client
  let response = await prisma.$transaction(async (prismaTransaction) => {
    return processClientItemRecursively(clientItem, currentTimestamp, prismaTransaction as PrismaClient);
  });

  if (response !== null && !(response instanceof Date)) {
    // Ensure the response corresponds to the schema
    response = response.descendants ? response : { ...response, descendants: [] };
    itemDescendantServerToClientSchema.parse(response);
  }

  return response;
}

async function processClientItemRecursively(
  clientItem: ItemDescendantClientStateType,
  currentTimestamp: Date,
  prismaTransaction: PrismaClient,
): Promise<ItemDescendantServerStateType | Date | null> {
  /*
   * Process ITEM
   */
  let serverItem: ItemDescendantServerStateType | Date | null = await processClientItem(
    clientItem,
    prismaTransaction,
    currentTimestamp,
  );

  /*
   * Process DESCENDANTS, if any
   */
  if (serverItem === null) {
    console.log(
      `processClientItemRecursively: clientItem.itemModel=${clientItem.itemModel}: processClientItem returned null`,
    );
    return serverItem;
  } else if (serverItem instanceof Date) {
    console.log(
      `processClientItemRecursively: clientItem.itemModel=${clientItem.itemModel}: processClientItem returned Date`,
    );
    return serverItem;
  } else if (clientItem.descendants.length === 0) {
    console.log(
      `processClientItemRecursively: clientItem.itemModel=${clientItem.itemModel}: clientItem has no descendants`,
    );
  } else {
    // Accumulate updates for each descendant
    // Pass along the serverItem's `id` for the case where the descendant has just been created on the server
    // and the descendants from the client do not contain the parentId yet
    const parentId = serverItem.id;
    let lastModified = serverItem.lastModified;
    const updatedDescendants: Array<ItemDescendantServerStateType> = [];
    console.log(
      `processClientItemRecursively: clientItem.itemModel=${clientItem.itemModel}: clientItem has ${clientItem.descendants.length} descendants to process:`,
      clientItem.descendants,
    );
    for (const descendant of clientItem.descendants) {
      const descendantResult = await processClientItemRecursively(
        { ...descendant, parentId },
        currentTimestamp,
        prismaTransaction,
      );
      if (descendantResult === null) {
        // FIXME: Need to determine an adequate timestamp to ensure the client
        // processes the update
        lastModified = new Date();
        console.log(
          `processClientItemRecursively: descendant.itemModel=${
            descendant.itemModel
          }: processItem returned ${descendantResult}: updated lastModified=${dateToISOLocal(lastModified)}`,
        );
      } else if (descendantResult instanceof Date) {
        lastModified = descendantResult > lastModified ? descendantResult : lastModified;
        console.log(
          `processClientItemRecursively: descendant.itemModel=${
            descendant.itemModel
          }: processItem returned Date=${dateToISOLocal(descendantResult)}: updated lastModified=${dateToISOLocal(
            lastModified,
          )}`,
        );
      } else {
        console.log(
          `processClientItemRecursively: descendant.itemModel=${descendant.itemModel}: descendantResult`,
          descendantResult,
        );
        updatedDescendants.push(descendantResult);
      }
    }
    serverItem = { ...serverItem, descendants: updatedDescendants, lastModified };
  }

  const response = augmentServerStateToDescendantServerState(serverItem);
  console.log(
    `processClientItemRecursively: clientItem.itemModel=${clientItem.itemModel}: returning response`,
    response,
  );
  return response;
}

async function processClientItem(
  clientItem: ItemClientStateType,
  prismaTransaction: PrismaClient,
  currentTimestamp: Date,
): Promise<ItemDescendantServerStateType | Date | null> {
  if (!clientItem.itemModel || !clientItem.parentId) {
    throw Error(
      `processClientItem: itemModel=${clientItem.itemModel} parentId=${
        clientItem.parentId
      } with clientItem: ${JSON.stringify(clientItem)}`,
    );
  }

  const itemModel = clientItem.itemModel;
  const parentId = clientItem.parentId;

  // Ensure that the client's lastModified timestamp is less recent than currentTimestamp
  const clientLastModified =
    clientItem.lastModified < currentTimestamp ? clientItem.lastModified : new Date(currentTimestamp.getTime() + 1);

  // The best case scenario is that the client was the only one to have made changes
  // In this case, we return only the `lastModified` timestamp of the client
  // to indicate that all modifications up to this point in time have been
  // applied by the server and there is nothing more recent to be aware of
  let serverItem: ItemServerStateType | Date = clientLastModified;

  const prismaItemModelInstance = getModelAccessor(itemModel, prismaTransaction);

  if (clientItem.id) {
    const existingClientItem = augmentClientStateToServerState(clientItem);
    const id = existingClientItem.id!;

    const serverOutput: ItemOutputType = await prismaItemModelInstance.findUnique({
      where: { id },
    });

    // If the item cannot be found, it means that the client has a stale copy
    // and should remove it
    if (!serverOutput) {
      console.log(`: client sent an item that does not exist on the server:`, clientItem);
      return null;
    }

    const serverLastModifiedDb = serverOutput?.lastModified;

    // Ensure that the server's lastModified timestamp is more recent than that of the client if both were invalid
    const serverLastModified =
      serverLastModifiedDb && serverLastModifiedDb < currentTimestamp ? serverLastModifiedDb : currentTimestamp;

    // Process logic only if the client state is more recent
    if (clientLastModified > serverLastModified) {
      console.log(
        `processClientItem ${itemModel} MERGE: item exists but clientLastModified=${dateToISOLocal(
          clientLastModified,
        )} > ${dateToISOLocal(serverLastModified)}=serverLastModified`,
      );
      const mergedItem = await updateServerItemWithClientItem(
        existingClientItem,
        serverLastModified,
        currentTimestamp,
        prismaItemModelInstance,
      );
      // Return the serverItem to indicate that further processing of
      // descendants of this item is required and the merged item can
      // be returned to the client
      serverItem = augmentServerOutputToServerState(mergedItem, clientItem);
    } else if (clientLastModified < serverLastModified) {
      // Client has older lastModified timestamp; this implies that the server
      // should ignore the client's version and any of its descendants
      console.log(
        `processClientItem ${itemModel}: NOOP: item exists and clientLastModified=${dateToISOLocal(
          clientLastModified,
        )} < ${dateToISOLocal(serverLastModified)}=serverLastModified`,
      );
    } else {
      // Same lastModified timestamp implies no differences for this item
      // It also implies that none of the descendants have been modified
      // by the client as any change to a descendant should have triggered
      // an upadate of this item's `lastModified` timestamp
      console.log(
        `processClientItem ${itemModel}: NOOP: item exists and clientLastModified=${dateToISOLocal(
          clientLastModified,
        )} == ${dateToISOLocal(serverLastModified)}=serverLastModified`,
      );
    }
  } else {
    // Create item and augment it with `clientId` to return to client
    // Even though the client is the originator of this item and thus
    // aware of the entire payload of this item, the client needs the
    // server-side `id` to persist in its local store
    const data = getItemDataForCreate<ItemClientToServerType>(clientItem, parentId, clientLastModified);
    console.log(`processClientItem ${itemModel}: CREATE `, "\n", clientItem);
    console.log(`processClientItem ${itemModel}.create:`, "\n", data);

    const createdItem = await prismaItemModelInstance.create({
      data,
    });
    serverItem = augmentServerOutputToServerState(createdItem, clientItem);
  }
  let response: ItemDescendantServerStateType | Date = clientLastModified;
  if (serverItem instanceof Date) {
    response = serverItem;
    console.log(`processClientItem ${itemModel}: client is up to date: returning response:`, response);
  } else {
    response = augmentServerStateToDescendantServerState(serverItem);
    console.log(
      `processClientItem ${itemModel}: serverItem:`,
      serverItem,
      "\n",
      ` augmented to ItemDescendantServerState: response:`,
      response,
    );
    itemDescendantServerStateSchema.parse(response);
  }
  return response;
}

async function updateServerItemWithClientItem(
  clientItem: ItemClientStateType,
  serverLastModified: Date,
  currentTimestamp: Date,
  prismaItemModelInstance: PrismaModelMethods[ItemDescendantModelNameType],
): Promise<ItemServerStateType | Date> {
  if (!clientItem.itemModel || !clientItem.parentId) {
    throw Error(
      `updateServerItemWithClientItem: itemModel=${clientItem.itemModel} parentId=${
        clientItem.parentId
      } with clientItem: ${JSON.stringify(clientItem)}`,
    );
  }

  const id = clientItem.id!;
  const itemModel = clientItem.itemModel;

  // Update current item properties
  console.log(`updateServerItemWithClientItem: ${itemModel}.update:`, {
    where: { id },
    data: getItemDataForUpdate<ItemClientToServerType>(clientItem, currentTimestamp),
  });
  const serverItem = await prismaItemModelInstance.update({
    where: { id },
    data: getItemDataForUpdate<ItemClientToServerType>(clientItem, currentTimestamp),
  });

  console.log(
    `updateServerItemWithClientItem ${itemModel}: SERVER UPDATED`,
    "\n",
    `update item ${itemModel} lastModified from ${dateToISOLocal(
      serverLastModified,
    )} to clientLastModified=${dateToISOLocal(clientItem.lastModified)}`,
  );

  // const mergedItemDescendant = {
  //   ...clientItem,
  //   lastModified: finalLastModified,
  //   descendants: [],
  // } as ItemDescendantServerStateType;
  // return mergedItemDescendant;

  const response = augmentServerOutputToServerState(serverItem, clientItem);
  if (!(response instanceof Date)) {
    itemServerStateSchema.parse(response);
    console.log(
      `updateServerItemWithClientItem ${itemModel}: SERVER UPDATED serverItem:`,
      serverItem,
      "\n",
      ` augmented to ItemServerState: response:`,
      response,
    );
  }
  return response;
}

function augmentServerOutputToServerState(
  serverItem: ItemOutputType | Date,
  clientItem: ItemClientStateType,
): ItemServerStateType | Date {
  if (serverItem instanceof Date) {
    return serverItem;
  }

  const { clientId, parentClientId, disposition, itemModel, descendantModel = null } = clientItem;

  const augmentedItem = {
    ...serverItem,
    clientId,
    parentClientId,
    disposition,
    itemModel,
    descendantModel,
  };
  itemServerStateSchema.parse(augmentedItem);

  return augmentedItem;
}

function augmentClientStateToServerState(clientItem: ItemClientStateType): ItemServerStateType {
  const parentId = clientItem.parentId!;
  const id = clientItem.id!;
  const itemModel = clientItem.itemModel!;
  const descendantModel = clientItem.descendantModel!;

  const augmentedItem = {
    ...clientItem,
    id,
    parentId,
    itemModel,
    descendantModel,
  };
  itemServerStateSchema.parse(augmentedItem);

  return augmentedItem;
}

function augmentServerStateToDescendantServerState(
  serverItem: ItemServerStateType | ItemDescendantServerStateType | Date,
): ItemDescendantServerStateType | Date {
  // Return null if serverItem is Date
  if (serverItem instanceof Date) {
    return serverItem;
  }

  // Check if the item already includes a descendants property
  if ("descendants" in serverItem) {
    // If it does, validate and return as is
    itemDescendantServerStateSchema.parse(serverItem);
    return serverItem;
  } else {
    // If it does not have a descendants property, add it and validate
    const itemDescendantServerItem: ItemDescendantServerStateType = {
      ...serverItem,
      descendants: [], // Adding an empty descendants array
    };

    itemDescendantServerStateSchema.parse(itemDescendantServerItem);
    return itemDescendantServerItem;
  }
}
