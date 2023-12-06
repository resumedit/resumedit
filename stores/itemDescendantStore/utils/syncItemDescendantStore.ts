// @/stores/itemDescendant/util/syncItemDescendant.ts

import { handleNestedItemDescendantListFromClient } from "@/actions/syncItemDescendant";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { getClientId, isValidItemId } from "@/schemas/id";
import { ItemDescendantClientStateType, ItemDescendantServerStateType } from "@/schemas/itemDescendant";
import { ClientIdType, ItemDisposition } from "@/types/item";
import { getDescendantModel, getItemDescendantStoreStateForServer } from "@/types/itemDescendant";
import { ModificationTimestampType } from "@/types/timestamp";
import { Draft } from "immer";
import { ItemDescendantClientState, ItemDescendantStore } from "../createItemDescendantStore";

export async function syncItemDescendantStoreWithServer(
  store: ItemDescendantStore,
  updateStoreWithServerData: (serverState: ItemDescendantServerStateType) => void,
  forceUpdate?: boolean,
): Promise<ItemDescendantServerStateType | Date | null> {
  let rootState = getItemDescendantStoreStateForServer(store);
  let clientModified = new Date(rootState.lastModified);
  if (forceUpdate) {
    clientModified = new Date(rootState.lastModified.getTime() + 1);
    rootState = updateItemToLastModifiedDescendant(rootState, clientModified);
    toast({
      title: `Forced synchronization`,
      description: `Updated lastModified: ${dateToISOLocal(new Date(clientModified))}`,
    });
  }
  const updatedState = await handleNestedItemDescendantListFromClient(rootState);

  if (updatedState && !(updatedState instanceof Date)) {
    updateStoreWithServerData(updatedState);
    const serverModified = updatedState.lastModified;

    if (serverModified > clientModified) {
      toast({
        title: `Synchronized`,
        description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
          rootState.descendants.length
        }\nServer: ${dateToISOLocal(new Date(updatedState.lastModified))}: ${updatedState.descendants.length}`,
      });
    }
  }
  return updatedState;
}
function updateItemToLastModifiedDescendant(
  item: ItemDescendantClientState,
  lastModified: Date,
): ItemDescendantClientState {
  // Base case: If the item has no descendants, return the item as is
  if (!item.descendants || item.descendants.length === 0) {
    if (item.disposition !== ItemDisposition.Synced) {
      return { ...item, lastModified: lastModified };
    }
    return item;
  }

  // Recursive case: Traverse the descendants and update their lastModified timestamps
  let latestTimestamp = item.disposition !== ItemDisposition.Synced ? lastModified : item.lastModified;
  const updatedDescendants = item.descendants.map((descendant) => {
    // Update each descendant recursively
    const updatedDescendant = updateItemToLastModifiedDescendant(descendant, lastModified);

    // Find the latest timestamp among descendants
    if (updatedDescendant.lastModified > latestTimestamp) {
      latestTimestamp = updatedDescendant.lastModified;
    }

    return updatedDescendant;
  });

  // Update the item's lastModified timestamp if a descendant has a more recent timestamp
  // or if the item itself is not synced
  if (latestTimestamp > item.lastModified || item.disposition !== ItemDisposition.Synced) {
    return {
      ...item,
      lastModified: latestTimestamp,
      descendants: updatedDescendants,
    };
  }

  // If no descendant has a more recent timestamp and item is synced, return the item with updated descendants
  return {
    ...item,
    descendants: updatedDescendants,
  };
}

export function handleNestedItemDescendantListFromServer(
  clientState: Draft<ItemDescendantStore>,
  serverState: ItemDescendantServerStateType,
): void {
  // Take the time
  const currentTimestamp = new Date();

  // First determine, whether the local store corresponds to the serverState
  if (isClientItemMatchingServerItem(clientState, serverState)) {
    window.consoleLog(`handleNestedItemDescendantListFromServer: serverState id and parentId match clientState`);
  } else {
    // Force complete initialization of the client's store
    window.consoleLog(
      `handleItemDescendantFromServer: SERVER id=${serverState.id} replaces clientState=${clientState.id} with serverState=${serverState.id}`,
    );
    // Reset `lastModified` to the epoch to ensure that the store is initialized with the server's state
    clientState.lastModified = new Date(0);
  }
  const clientSyncedUpTo = processServerItemRecursively(clientState, serverState);
  if (clientSyncedUpTo > clientState.lastModified) {
    window.consoleLog(
      `handleNestedItemDescendantListFromServer: `,
      "\n",
      `clientSyncedUpTo=${clientSyncedUpTo}`,
      "\n",
      `currentTimestamp=${currentTimestamp}`,
      "\n",
      `clientLastModified=${clientState.lastModified}`,
    );
  }
}

export function processServerItemRecursively(
  clientItem: Draft<ItemDescendantStore>,
  serverItem: ItemDescendantServerStateType,
): Date {
  let serverLastModified: Date;
  const clientLastModified = clientItem.lastModified;
  let itemSyncedUpTo = clientLastModified,
    descendantsSyncedUpTo = clientLastModified;
  if (serverItem instanceof Date) {
    window.consoleLog(
      `processServerItemRecursively: serverItem.itemModel=${serverItem.itemModel}: server returned serverItem as Date`,
    );
    //
    serverLastModified = serverItem;
  } else {
    serverLastModified = serverItem.lastModified;
    /*
     * Process ITEM
     */
    // Update the state of the current item with the server's data,
    // ignoring any items that have a more recent lastModified timestamp
    // than serverLastModified
    // The result of this function is a timestamp:
    // A. Same as serverLastModified: indicates no changes more recent than server
    // B. More recent than serverLastModified: indicates changes have occured and
    //    need to be synced to the server
    itemSyncedUpTo = updateClientItemWithServerItem(clientItem, serverItem);

    /*
     * Process DESCENDANTS, if any
     */
    if (serverItem.descendants.length === 0) {
      window.consoleLog(
        `processItemRecursively: clientItem.itemModel=${serverItem.itemModel}: serverItem has no descendants`,
      );
    } else {
      window.consoleLog(
        `processServerItemRecursively: serverItem.itemModel=${serverItem.itemModel}: serverItem has ${serverItem.descendants.length} descendants to process:`,
        serverItem.descendants,
      );
      // Only attempt to merge descendants if the itemModel has a descendant model
      const descendantModel = getDescendantModel(serverItem.itemModel);
      if (descendantModel) {
        // The result of this function is a timestamp:
        // A. Same as serverLastModified: indicates no changes more recent than server
        // B. More recent than serverLastModified: indicates changes have occured and
        //    need to be synced to the server
        descendantsSyncedUpTo = mergeDescendantListFromServer(clientItem, serverItem);
      }
    }
  }
  window.consoleLog(
    `processServerItemRecursively(clientItem=${clientItem.id}, serverItem=${serverItem.id}):`,
    "\n",
    `clientLastModified: ${dateToISOLocal(clientLastModified)}`,
    "\n",
    `serverLastModified: ${dateToISOLocal(serverLastModified)}`,
    "\n",
    `itemSyncedUpTo: ${dateToISOLocal(itemSyncedUpTo)}`,
    "\n",
    `descendantsSyncedUpTo: ${dateToISOLocal(descendantsSyncedUpTo)}`,
  );

  return descendantsSyncedUpTo;
}

function updateClientItemWithServerItem(
  clientItem: Draft<ItemDescendantClientStateType>,
  serverItem: ItemDescendantServerStateType,
): Date {
  const originalClientItem = { ...clientItem };
  // Obtain a copy of the serverState but exclude `lastModified` and `descendants`,
  // as those properties require separate handling
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { lastModified: serverLastModified, descendants: serverDescendants, ...serverItemProperties } = serverItem;
  const clientLastModified = clientItem.lastModified;
  // Determine if the server is aware of any changes that happened after the last local modification
  if (serverLastModified > clientLastModified) {
    window.consoleLog(`updateClientItemWithServerItem: SERVER is more recent`);
  } else {
    // Server confirms to have applied all modifications from the client (if any)
    // and there are no modifications that happened more recently
    window.consoleLog(`updateClientItemWithServerItem: CLIENT is up to date with server`);
    // Even though client is up to date, we still need to set the `disposition` of all items
    // with a lastMofified timestamp equal or older to that of the server to `Synced`
  }

  const updatedItem = { ...serverItemProperties, deletedAt: getDeletedAtProperty(clientItem, serverItem) };

  // Directly mutate the properties of clientItem
  Object.assign(clientItem, updatedItem);

  // Determine if there have been any changes after the server's timestap
  let itemSyncedUpTo: Date;
  if (clientLastModified > serverLastModified) {
    // Client is in sync with server up to the server's timestamp
    itemSyncedUpTo = serverLastModified;
    clientItem.disposition =
      clientItem.disposition === ItemDisposition.Synced ? ItemDisposition.Modified : clientItem.disposition;
  } else {
    // Client is in sync with server up to the client's timestamp
    itemSyncedUpTo = clientLastModified;
    // Set disposition to `Synced`
    clientItem.disposition = ItemDisposition.Synced;
  }
  window.consoleLog(
    `updateClientItemWithServerItem: updated clientItem`,
    "\n",
    originalClientItem,
    "\nto\n",
    clientItem,
    `originalClientItem.lastModified=${dateToISOLocal(originalClientItem.lastModified)}`,
    "\n",
    `serverItem.lastModified=${dateToISOLocal(serverItem.lastModified)}`,
  );

  return itemSyncedUpTo;
}

function mergeDescendantListFromServer(
  clientState: Draft<ItemDescendantClientStateType>,
  serverState: ItemDescendantServerStateType,
): Date {
  let descendantsSyncedUpTo: Date;
  const serverModified: ModificationTimestampType = serverState.lastModified;
  const clientModified = clientState.lastModified;

  const clientHasDescendants = clientState.descendants?.length > 0;
  const serverHasDescendants = serverState.descendants?.length > 0;
  let lastModifiedDescendant = clientModified;
  if (clientHasDescendants && serverHasDescendants) {
    for (const serverDescendant of serverState.descendants) {
      let clientDescendant;
      const descendantLastModified = serverDescendant.lastModified;
      // FIXME: Server should only return a clientId for newly created items
      // Currently, it returns one for all items that the client sent, even those that
      // are not new to the server
      if (serverDescendant.clientId) {
        clientDescendant = clientState.descendants.find(
          (descendant: ItemDescendantClientStateType) => descendant.clientId === serverDescendant.clientId,
        );
      } else {
        clientDescendant = clientState.descendants.find(
          (descendant: ItemDescendantClientStateType) => descendant.id === serverDescendant.id,
        );
      }
      if (clientDescendant && isClientItemMatchingServerItem(clientDescendant, serverDescendant)) {
        if (!clientDescendant.id) {
          // Assign the server's id
          clientDescendant.id = serverDescendant.id;
        }

        // Update if server is more recent
        if (serverDescendant.lastModified < clientDescendant.lastModified) {
          window.consoleLog(
            "mergeDescendantListFromServer: Ignoring update from server to avoid overwriting local changes:\n",
            `clientDescendant.lastModified=${dateToISOLocal(clientDescendant.lastModified)}`,
            "\n",
            `serverDescendant.lastModified=${dateToISOLocal(serverDescendant.lastModified)}`,
          );
        } else {
          // Server version is more recent
          // FIXME: The call below should no longer be necessary
          // Before merging the descendant, we need to descend into the next level down
          // descendantLastModified = mergeDescendantListFromServer(clientDescendant, serverDescendant);
          updateClientItemWithServerItem(clientDescendant, serverDescendant);
        }
      } else {
        // New item from server
        const newDescendant = augmentItemDescendantRecursively({ ...serverDescendant }, clientState.clientId);
        clientState.descendants = [...clientState.descendants, newDescendant];
      }
      lastModifiedDescendant =
        descendantLastModified > lastModifiedDescendant ? descendantLastModified : lastModifiedDescendant;
    }
    descendantsSyncedUpTo = lastModifiedDescendant;
  } else if (clientHasDescendants) {
    // Only the client has descendants.
    // If the server has a more recent item timestamp, we remove the client's descendants
    if (clientModified < serverModified) {
      window.consoleLog(
        `mergeDescendantListFromServer: SERVER is more recent and provided an empty descendant list: empty descendants of client`,
      );
      clientState.descendants = [];
      descendantsSyncedUpTo = serverModified;
    } else {
      descendantsSyncedUpTo = clientModified;
    }
  } else if (serverHasDescendants) {
    // Only the server has descendants
    if (clientModified <= serverModified) {
      window.consoleLog(
        `mergeDescendantListFromServer: SERVER is more recent and client has no descendants: Initialize with server's descendants`,
      );
      // Descendant list of server initializes the one of the client
      // Before we merge this new descendant from the server, we need to
      // augment its descendant list with clientIds recursively
      const augmentedServerState = augmentItemDescendantRecursively(serverState, clientState.clientId);
      Object.assign(clientState, augmentedServerState);
    }
    // Now client's descendants are at the same timestamp as server
    descendantsSyncedUpTo = serverModified;
  } else {
    // Neither server nor client have descendants
    window.consoleLog(`mergeDescendantListFromServer: neither server nor client item have descendants`);
    descendantsSyncedUpTo = clientModified;
  }
  return descendantsSyncedUpTo;
}

function augmentItemDescendantRecursively(
  serverItem: ItemDescendantServerStateType,
  parentClientId: ClientIdType,
): Draft<ItemDescendantClientStateType> {
  // Disposition property is set to `synced` on all items
  const dispositionProperty = {
    disposition: ItemDisposition.Synced,
  };
  const itemModel = serverItem.itemModel!;
  const descendantModel = serverItem.descendantModel || getDescendantModel(itemModel);
  const modelProperties = {
    itemModel,
    descendantModel,
  };

  const clientId = getClientId(itemModel!);

  const clientDescendants = serverItem.descendants.map((serverDescendant) => {
    const newDescendant = augmentItemDescendantRecursively(serverDescendant, clientId);
    return newDescendant as ItemDescendantServerStateType;
  });

  const clientItem = {
    ...serverItem,
    ...modelProperties,
    ...dispositionProperty,
    parentClientId,
    clientId,
    descendants: clientDescendants || [],
  };
  return clientItem as Draft<ItemDescendantClientStateType>;
}

function isClientItemMatchingServerItem(
  clientItem: ItemDescendantClientStateType,
  serverItem: ItemDescendantServerStateType,
) {
  if (!clientItem.clientId || !clientItem.parentClientId) {
    throw Error(
      `isClientItemMatchingServerItem: clientId=${clientItem.clientId} parentClientId=${clientItem.parentClientId}`,
    );
  }
  if (clientItem.lastModified > serverItem.lastModified) {
    if (clientItem.disposition !== ItemDisposition.Modified) {
      throw Error(
        `isClientItemMatchingServerItem: clientItem more recent than server but disposition= ${clientItem.disposition}`,
      );
    }
  }
  if (!(clientItem.lastModified instanceof Date) || !(clientItem.createdAt instanceof Date)) {
    throw Error(
      `isClientItemMatchingServerItem: clientItem timestamps are not "Date" objects: lastModified is ${typeof clientItem.lastModified} createdAt is ${typeof clientItem.createdAt}`,
    );
  }
  if (clientItem.id === undefined) {
    // For items that have just been sent to the server and are now being returned,
    // matching is based on `clientId` and `parentClientId`
    const createdItem = isValidItemId(clientItem.clientId) && clientItem.clientId === serverItem.clientId;
    return createdItem;
  } else {
    // Matching is based on `id` and `parentId` for items
    // that have already been persisted on the server
    const existingItem = isValidItemId(clientItem.id) && clientItem.id === serverItem.id;
    if (existingItem) {
      if (!isValidItemId(clientItem.parentId) || !(clientItem.parentId === serverItem.parentId)) {
        throw Error(`isClientItemMatchingServerItem: matching ids but different or invalid parentId`);
      }
    }
    return existingItem;
  }
}

function getDeletedAtProperty(clientItem: ItemDescendantClientStateType, serverItem: ItemDescendantServerStateType) {
  let deletedAtProperty = null;
  if (serverItem?.deletedAt) {
    if (clientItem?.deletedAt) {
      // If both client and server consider the item deleted, the more recent timestamp wins
      deletedAtProperty = serverItem.deletedAt > clientItem.deletedAt ? serverItem.deletedAt : clientItem.deletedAt;
    } else {
      // Avoid soft deleting client item that has been modified locally
      // later than the time of deletion according to the server
      if (clientItem.lastModified < serverItem.deletedAt) {
        // Server has item deleted later than the last modification of the client,
        // so accept it as deleted
        deletedAtProperty = serverItem.deletedAt;
      }
    }
  }
  return deletedAtProperty;
}

export function sanitizeItemDescendantClientState(
  clientState: Draft<ItemDescendantStore>,
  logUpdateFromServer = false,
): void {
  let invalidDates = 0;
  clientState.descendants.forEach((item) => {
    const createdValid = item.createdAt instanceof Date;
    const modifiedValid = item.lastModified instanceof Date;
    if (createdValid && modifiedValid) {
      if (item.lastModified > clientState.lastModified) {
        clientState.lastModified = item.lastModified;
      }
      if (item.id) {
        item.disposition = ItemDisposition.Synced;
      } else {
        item.disposition = ItemDisposition.New;
      }
    } else {
      if (!createdValid) {
        if (logUpdateFromServer) {
          window.consoleLog(`sanitizeItemDescendantClientState: invalid createdAt:`, item.createdAt);
        }
        item.createdAt = new Date(0);
        item.disposition = ItemDisposition.Modified;
        invalidDates++;
      }
      if (!modifiedValid) {
        if (logUpdateFromServer) {
          window.consoleLog(`sanitizeItemDescendantClientState: invalid lastModified:`, item.lastModified);
        }
        item.lastModified = new Date(0);
        item.disposition = ItemDisposition.Modified;
        invalidDates++;
      }
    }
    if (item.deletedAt && item.deletedAt < item.createdAt) {
      item.deletedAt = item.createdAt;
    }
  });

  if (invalidDates > 0) {
    clientState.lastModified = new Date(0);
    if (logUpdateFromServer) {
      window.consoleLog(
        `sanitizeItemDescendantClientState: ${invalidDates} invalid dates. Reset lastModified to ${clientState.lastModified}`,
      );
    }
  }
}
