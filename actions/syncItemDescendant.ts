// @/actions/syncItemDescendant.ts

"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { IdSchemaType, idDefault } from "@/schemas/id";
import {
  ItemClientStateType,
  ItemClientToServerType,
  ItemOutputType,
  ItemServerOutputType,
  ItemServerStateType,
} from "@/schemas/item";
import {
  ItemDescendantClientStateType,
  ItemDescendantServerOutputListType,
  ItemDescendantServerStateType,
  itemDescendantServerStateSchema,
  itemDescendantServerToClientSchema,
} from "@/schemas/itemDescendant";
import { UserInputType } from "@/schemas/user";
import { ItemDisposition } from "@/types/item";
import {
  ItemDescendantModelNameType,
  PrismaModelMethods,
  getModelAccessor,
  itemDescendantModelHierarchy,
} from "@/types/itemDescendant";
import {
  augmentClientStateToServerState,
  augmentServerOutputToServerState,
  augmentServerStateToDescendantServerState,
  augmentToItemDescendantServerState,
  getItemDataForCreate,
  getItemDataForUpdate,
} from "@/types/utils/itemDescendant";
import { PrismaClient } from "@prisma/client";
import { getItemDescendantList, getItemsByParentId } from "./itemDescendant";

export async function handleNestedItemDescendantListFromClient(
  clientItem: ItemDescendantClientStateType,
): Promise<ItemDescendantServerStateType> {
  // Take the time
  const currentTimestamp = new Date();

  console.log(`handleNestedItemDescendantListFromClient: clientItem`, clientItem);

  let response;
  if (process.env.NODE_ENV === "development") {
    // Avoid using a transaction to facilitate debugging
    response = await processClientItemDescendant(clientItem, currentTimestamp);
  } else {
    // Process the entire update in a transaction and capture the result to respond to the client
    response = await prisma.$transaction(async (prismaTransaction) => {
      return processClientItemDescendant(clientItem, currentTimestamp, prismaTransaction as PrismaClient);
    });
  }

  // Ensure the response corresponds to the schema
  response = response.descendants ? response : { ...response, descendants: [] };
  itemDescendantServerToClientSchema.parse(response);

  return response;
}

async function processClientItemDescendant(
  clientItem: ItemDescendantClientStateType,
  currentTimestamp: Date,
  prismaTransaction: PrismaClient = prisma,
): Promise<ItemDescendantServerStateType> {
  const { itemModel, descendantModel } = clientItem;
  const prismaItemModelInstance = getModelAccessor(itemModel, prismaTransaction);

  const logPrefix = `processClientItemDescendant: clientItem.itemModel=${itemModel}:` + "\n";
  /*
   * Process ITEM
   */
  const serverItem: ItemServerStateType = await processClientItem(
    clientItem,
    currentTimestamp,
    prismaItemModelInstance,
  );

  if (serverItem.disposition === ItemDisposition.Obsoleted) {
    return augmentServerStateToDescendantServerState(serverItem);
  }

  const processedDescendantIds = new Set<IdSchemaType>();
  const descendants: Array<ItemDescendantServerStateType> = [];
  /*
   * Process DESCENDANTS, if any
   */
  if (descendantModel) {
    if (clientItem.descendants.length > 0) {
      // Accumulate updates for each descendant
      // Pass along the serverItem's `id` for the case where the descendant has just been created on the server
      // and the descendants from the client do not contain the parentId yet
      const parentId = serverItem.id;
      console.log(
        logPrefix,
        `clientItem has ${clientItem.descendants.length} descendants to process:`,
        clientItem.descendants,
      );
      for (const descendant of clientItem.descendants) {
        const descendantResult = await processClientItemDescendant(
          { ...descendant, parentId },
          currentTimestamp,
          prismaTransaction,
        );
        console.log(logPrefix, `descendantResult`, descendantResult);
        descendants.push(descendantResult);
        processedDescendantIds.add(descendantResult.id);
      }
    }

    // Now that the client state has been applied, augment it with any additional descendants known to the server
    const serverDescendants = (await getItemsByParentId(
      descendantModel,
      serverItem.id,
    )) as ItemDescendantServerOutputListType;
    for (const serverDesc of serverDescendants) {
      if (!processedDescendantIds.has(serverDesc.id)) {
        const serverOutput = await getItemDescendantList(descendantModel, serverDesc.id, prismaTransaction);
        if (serverOutput) {
          const serverStateDescendant = augmentToItemDescendantServerState(serverOutput, descendantModel);
          descendants.push(serverStateDescendant);
        }
      }
    }
    if (descendants.length < Math.max(clientItem.descendants.length, serverDescendants.length)) {
      throw Error(
        logPrefix +
          ` invalid descendants: ${descendants.length}  < max(` +
          `clientItem.descendants: ${clientItem.descendants.length}` +
          `serverDescendants: ${serverDescendants.length})`,
      );
    }
  }
  const response: ItemDescendantServerStateType = {
    ...serverItem,
    descendants,
  };
  itemDescendantServerStateSchema.parse(response);

  console.log(logPrefix, `returning response`, response);
  return response;
}

async function processClientItem(
  clientItem: ItemClientStateType,
  currentTimestamp: Date,
  prismaItemModelInstance: PrismaModelMethods[ItemDescendantModelNameType],
): Promise<ItemServerStateType> {
  if (!clientItem.itemModel || !clientItem.parentId) {
    throw Error(
      `processClientItem: itemModel=${clientItem.itemModel} parentId=${
        clientItem.parentId
      } with clientItem: ${JSON.stringify(clientItem)}`,
    );
  }

  const logPrefix = `processClientItem: itemModel=${clientItem.itemModel}:`;
  const parentId = clientItem.parentId;

  // The best case scenario is that the client was the only one to have made changes
  // In this case, we return only the `lastModified` timestamp of the client
  // to indicate that all modifications up to this point in time have been
  // applied by the server and there is nothing more recent to be aware of
  let serverItem: ItemServerStateType;

  if (clientItem.id) {
    const id = clientItem.id;

    const serverOutput: ItemOutputType = await findItemById(prismaItemModelInstance, clientItem.itemModel, id);

    // If the item cannot be found, it means that the client has an obsoleted
    // and should remove it
    if (!serverOutput) {
      const obsoletedClientItem = augmentClientStateToServerState(
        clientItem,
        ItemDisposition.Obsoleted,
        currentTimestamp,
      );
      console.log(`: tell client to delete the item that does not exist on the server:`, obsoletedClientItem);
      return augmentServerStateToDescendantServerState(obsoletedClientItem);
    }

    // Handle the client's update
    serverItem = await updateServerItemWithClientItem(
      clientItem,
      serverOutput,
      currentTimestamp,
      prismaItemModelInstance,
    );
  } else {
    // Create item and augment it with `clientId` to return to client
    // Even though the client is the originator of this item and thus
    // aware of the entire payload of this item, the client needs the
    // server-side `id` to persist in its local store
    const createdItem = await createFromClientItem(prismaItemModelInstance, clientItem, parentId, logPrefix);
    serverItem = augmentServerOutputToServerState(createdItem, clientItem, ItemDisposition.Synced);
  }
  const response = augmentServerStateToDescendantServerState(serverItem);
  console.log(
    logPrefix,
    `serverItem:`,
    serverItem,
    "\n",
    ` augmented to ItemDescendantServerState: response:`,
    response,
  );
  itemDescendantServerStateSchema.parse(response);
  return response;
}

async function updateServerItemWithClientItem(
  clientItem: ItemClientStateType,
  serverOutput: ItemOutputType,
  currentTimestamp: Date,
  prismaItemModelInstance: PrismaModelMethods[ItemDescendantModelNameType],
): Promise<ItemServerStateType> {
  if (!clientItem.itemModel || !clientItem.parentId) {
    throw Error(
      `updateServerItemWithClientItem: itemModel=${clientItem.itemModel} parentId=${
        clientItem.parentId
      } with clientItem: ${JSON.stringify(clientItem)}`,
    );
  }
  const id = clientItem.id!;
  const itemModel = clientItem.itemModel;
  const logPrefix = `updateServerItemWithClientItem ${itemModel}:`;

  const clientLastModified = clientItem.lastModified,
    serverLastModified = serverOutput.lastModified;

  let serverResponse;
  let timestampRelation = "=";
  let mergeStrategy = "";
  // Update the server state if the client is more recent
  if (clientLastModified > serverLastModified) {
    timestampRelation = ">";
    mergeStrategy = `MERGE: item exists`;

    const updatedServerOutput = await updateWithClientItem(prismaItemModelInstance, clientItem, id);
    // Return the item with a disposition of `Synced` to indicate that:
    // - The serverResponse indicates to the client that the server is now at the same state as the client
    // - Descendants of this item should be processed
    serverResponse = augmentServerOutputToServerState(updatedServerOutput, clientItem, ItemDisposition.Synced);

    console.log(
      logPrefix,
      `SERVER UPDATED: update item ${itemModel} lastModified from ${dateToISOLocal(
        serverLastModified,
      )} to clientLastModified=${dateToISOLocal(clientItem.lastModified)}`,
    );
  } else if (clientLastModified < serverLastModified) {
    timestampRelation = "<";
    // Return the item with a disposition of `Modified` to indicate that:
    // - The client should updates its state unless it has made more modifications in the meantime
    // - Descendants of this item should be processed
    serverResponse = augmentServerOutputToServerState(
      serverOutput,
      clientItem,
      ItemDisposition.Modified,
      serverLastModified,
    );
    mergeStrategy = `CLIENT NEEDS UPDATE: item exists and is more recent than client state`;
  } else {
    mergeStrategy = `NOOP: item exists and has the same lastModified timestamp as the client`;
    serverResponse = augmentServerOutputToServerState(
      serverOutput,
      clientItem,
      ItemDisposition.Synced,
      serverLastModified,
    );
  }
  timestampRelation =
    `clientLastModified=${dateToISOLocal(clientLastModified)} ` +
    timestampRelation +
    ` ${dateToISOLocal(serverLastModified)}=serverLastModified`;
  console.log(logPrefix, mergeStrategy, timestampRelation, serverResponse);
  return serverResponse;
}

function ensureServerOutputHasParentId(serverOutput: ItemServerOutputType, itemModel: ItemDescendantModelNameType) {
  // Augment output with default id if the model does not have a parentId
  if (itemModel === itemDescendantModelHierarchy[0]) {
    return { ...serverOutput, parentId: idDefault };
  }
  return serverOutput;
}

async function findItemById(
  prismaItemModelInstance: PrismaModelMethods[ItemDescendantModelNameType],
  itemModel: ItemDescendantModelNameType,
  id: string,
) {
  let serverOutput = await prismaItemModelInstance.findUnique({
    where: { id },
  });
  serverOutput = ensureServerOutputHasParentId(serverOutput, itemModel);
  return serverOutput;
}

async function createFromClientItem(
  prismaItemModelInstance: PrismaModelMethods[ItemDescendantModelNameType],
  clientItem: ItemClientStateType,
  parentId: IdSchemaType,
  logPrefix?: string,
) {
  const data = getItemDataForCreate<ItemClientToServerType>(clientItem, parentId);
  let createdServerOutput = await prismaItemModelInstance.create({
    data,
  });

  createdServerOutput = ensureServerOutputHasParentId(createdServerOutput, clientItem.itemModel);

  console.log(logPrefix, `CREATE `, "\n", clientItem);
  console.log(logPrefix, `${clientItem.itemModel}.create:`, "\n", data);

  return createdServerOutput;
}

async function updateWithClientItem(
  prismaItemModelInstance: PrismaModelMethods[ItemDescendantModelNameType],
  clientItem: ItemClientStateType,
  id: IdSchemaType,
  logPrefix?: string,
) {
  let data;
  // The `User` model requires special treatment
  if (clientItem.itemModel === "user") {
    const { id, email, firstName, lastName } = clientItem as unknown as UserInputType;
    data = { id, email, firstName, lastName };
  } else {
    data = getItemDataForUpdate<ItemClientToServerType>(clientItem);
  }

  let updatedServerOutput = await prismaItemModelInstance.update({
    where: { id },
    data,
  });

  updatedServerOutput = ensureServerOutputHasParentId(updatedServerOutput, clientItem.itemModel);

  console.log(logPrefix, `UPDATE `, "\n", clientItem);
  console.log(logPrefix, `${clientItem.itemModel}.update:`, "\n", data);

  return updatedServerOutput;
}
