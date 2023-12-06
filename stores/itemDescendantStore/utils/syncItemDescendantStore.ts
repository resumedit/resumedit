// @/stores/itemDescendant/util/syncItemDescendant.ts

import { handleNestedItemDescendantListFromClient } from "@/actions/syncItemDescendant";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { getClientId, isValidItemId } from "@/schemas/id";
import {
  ItemDescendantClientStateType,
  ItemDescendantOrderableClientStateListType,
  ItemDescendantServerStateType,
} from "@/schemas/itemDescendant";
import { ClientIdType, ItemDisposition } from "@/types/item";
import { getDescendantModel, getItemOrderFunction, getParentModel } from "@/types/itemDescendant";
import { ModificationTimestampType } from "@/types/timestamp";
import { getItemDescendantStoreStateForServer } from "@/types/utils/itemDescendant";
import { Draft } from "immer";
import { ItemDescendantStore } from "../createItemDescendantStore";
import { sortDescendantsByOrderValues } from "./descendantOrderValues";

export async function syncItemDescendantStoreWithServer(
  store: ItemDescendantStore,
  updateLastModifiedOfModifiedItems: (overrideLastModified?: Date) => void,
  updateStoreWithServerData: (serverState: ItemDescendantServerStateType) => void,
  forceUpdate?: boolean,
): Promise<ItemDescendantServerStateType | Date | null> {
  const rootState = getItemDescendantStoreStateForServer(store);
  let clientModified = new Date(rootState.lastModified);
  if (forceUpdate) {
    // Advance the lastModified timestamp by a second / 1000ms
    clientModified = new Date(rootState.lastModified.getTime() + 1000);
    updateLastModifiedOfModifiedItems(clientModified);
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

export function handleNestedItemDescendantListFromServer(
  clientState: Draft<ItemDescendantStore>,
  serverState: ItemDescendantServerStateType,
): void {
  // Take the time
  const currentTimestamp = new Date();

  // First determine, whether the local store corresponds to the serverState
  if (clientItemMatchesServerItem(clientState, serverState)) {
    window.consoleLog(`handleNestedItemDescendantListFromServer: serverState id and parentId match clientState`);
  } else {
    // Force complete initialization of the client's store
    window.consoleLog(
      `handleItemDescendantFromServer: SERVER id=${serverState.id} replaces clientState=${clientState.id} with serverState=${serverState.id}`,
    );
    // Reset `lastModified` to the epoch to ensure that the store is initialized with the server's state
    clientState.lastModified = new Date(0);
  }
  const updatedClientState = processServerItemDescendant(clientState, serverState);
  window.consoleLog(
    `handleNestedItemDescendantListFromServer: `,
    "\n",
    `updatedClientState=${JSON.stringify(updatedClientState, undefined, 2).split("\n", 10).join("\n")}`,
    "\n",
    `currentTimestamp=${currentTimestamp}`,
    "\n",
    `clientLastModified=${clientState.lastModified}`,
  );
}

export function processServerItemDescendant(
  clientItem: Draft<ItemDescendantClientStateType>,
  serverItem: ItemDescendantServerStateType,
): ItemDescendantClientStateType {
  const serverLastModified = serverItem.lastModified;
  // If the client item has the specific initial timestamp of 0, we overwrite it with the server item
  if (clientItem.lastModified.getTime() === 0) {
    clientItem.lastModified = serverLastModified;
  }
  const clientLastModified = clientItem.lastModified;
  const logPrefix = `processServerItemDescendant: serverItem.itemModel=${serverItem.itemModel} clientItem=${clientItem.id}, serverItem=${serverItem.id}: `;
  /*
   * Process ITEM
   */
  // Update the state of the current item with the server's data,
  // ignoring any items that locally have a more recent lastModified timestamp
  // than serverLastModified
  // The result of this function is a timestamp:
  // A. Same as serverLastModified: indicates no changes more recent than server
  // B. More recent than serverLastModified: indicates changes have occured and
  //    need to be synced to the server
  updateClientItemWithServerItem(clientItem, serverItem);

  /*
   * Process DESCENDANTS, if any
   */
  if (serverItem.descendants.length === 0) {
    window.consoleLog(logPrefix, `serverItem has no descendants`);
  } else {
    window.consoleLog(
      logPrefix,
      `serverItem has ${serverItem.descendants.length} descendants to process:`,
      "\n",
      serverItem.descendants,
    );
    // The result of this function is a timestamp:
    // A. Same as serverLastModified: indicates no changes more recent than server
    // B. More recent than serverLastModified: indicates changes have occured and
    //    need to be synced to the server
    mergeDescendantListFromServer(clientItem, serverItem);
  }

  window.consoleLog(
    logPrefix,
    "\n",
    `clientLastModified: ${dateToISOLocal(clientLastModified)}`,
    "\n",
    `serverLastModified: ${dateToISOLocal(serverLastModified)}`,
    JSON.stringify(clientItem, undefined, 2).split("\n", 10).join("\n"),
  );

  return clientItem;
}

function updateClientItemWithServerItem(
  clientItem: Draft<ItemDescendantClientStateType>,
  serverItem: ItemDescendantServerStateType,
): void {
  let timestampRelation = ">";
  let mergeStrategy = "";
  const originalClientItem = { ...clientItem };
  // Obtain a copy of the serverState but exclude `lastModified` and `descendants`,
  // as those properties require separate handling
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    lastModified: serverLastModified,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    descendants: serverDescendants,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clientId: serverClientId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parentClientId: serverParentClientId,
    ...serverItemProperties
  } = serverItem;
  const clientLastModified = clientItem.lastModified;
  // Up to which time is the client in sync with the server? Ideally, the server has simply applied all our changes
  // and we are now in sync up to the timestamp returned by the server as this would correspond to that of the client
  // at the time of initiating the sync
  let itemUpdateProperties = serverItemProperties as ItemDescendantClientStateType;
  const logPrefix = "updateClientItemWithServerItem:";
  if (serverLastModified > clientLastModified) {
    // The server has not applied our update and responding with a more recent version of this item
    // Disposition determines, how we interpret this update
    if (serverItem.disposition === ItemDisposition.Deleted) {
      // Item has been deleted, either by business logic on the server or triggered by another client
      mergeStrategy = "DELETE";
    } else if (
      serverItem.disposition === ItemDisposition.Modified ||
      serverItem.disposition === ItemDisposition.Initial
    ) {
      // Item has been updated by another client and the server is now returning us this more recent version
      mergeStrategy = "OVERWRITE";
      itemUpdateProperties = {
        ...serverItemProperties,
        disposition: ItemDisposition.Synced,
        lastModified: serverLastModified,
        deletedAt: getDeletedAtProperty(clientItem, serverItem),
      } as ItemDescendantClientStateType;
    } else {
      throw Error(logPrefix + ` unexpected serverItem.disposition ${serverItem.disposition}`);
    }

    // Since we have dutifully updated our item to match what the server sent, the client is now in sync
    // with server up to the server's timestamp
  } else if (serverLastModified < clientLastModified) {
    // There have been changes on the client after initiating the sync, but the server is not aware of those.
    timestampRelation = "<";
    if (serverItem.disposition === ItemDisposition.Deleted) {
      // Item has been deleted, either by business logic on the server or triggered by another client
      // Since there have been local modifications in the meantime, we need to persist this item on the
      // server under a new server `id`
      itemUpdateProperties = {
        ...serverItemProperties,
        id: undefined,
        lastModified: serverLastModified,
        disposition: ItemDisposition.New,
        deletedAt: getDeletedAtProperty(clientItem, serverItem),
      } as ItemDescendantClientStateType;

      mergeStrategy = "RECREATE";
    } else if (
      serverItem.disposition === ItemDisposition.Synced ||
      serverItem.disposition === ItemDisposition.Initial
    ) {
      mergeStrategy = "IGNORE";
    } else {
      throw Error(logPrefix + ` unexpected serverItem.disposition ${serverItem.disposition}`);
    }
    // Client was in sync with server up to the server's timestamp, but has since diverged
    // and is in fact not in sync anymore
  } else {
    // The server has applied the update the client sent and both are now in sync
    timestampRelation = "=";
    if (serverItem.disposition === ItemDisposition.Synced || serverItem.disposition === ItemDisposition.Initial) {
      mergeStrategy = "SYNCED";
      itemUpdateProperties = {
        ...serverItemProperties,
        disposition: ItemDisposition.Synced,
        deletedAt: getDeletedAtProperty(clientItem, serverItem),
      } as ItemDescendantClientStateType;
    } else {
      throw Error(logPrefix + ` unexpected serverItem.disposition ${serverItem.disposition}`);
    }
    // Server confirms to have applied all modifications from the client (if any)
    // and there are no modifications that happened more recently
    // Client is in sync with server up to the client = server's timestamp
  }
  if ("descendants" in itemUpdateProperties) {
    throw Error(
      logPrefix +
        " " +
        mergeStrategy +
        `: unexpected property "descendants" in itemUpdateProperties: ${JSON.stringify(itemUpdateProperties)
          .split("\n", 10)
          .join("\n")}`,
    );
  }
  // Mutate the properties of the clientItem
  Object.assign(clientItem, itemUpdateProperties);

  timestampRelation =
    `clientLastModified=${dateToISOLocal(clientLastModified)} ` +
    timestampRelation +
    ` ${dateToISOLocal(serverLastModified)}=serverLastModified`;

  window.consoleLog(
    logPrefix,
    mergeStrategy,
    timestampRelation,
    "\n",
    originalClientItem,
    "\n updated to\n",
    clientItem,
  );
}

function mergeDescendantListFromServer(
  clientItem: Draft<ItemDescendantClientStateType>,
  serverItem: ItemDescendantServerStateType,
): void {
  const serverModified: ModificationTimestampType = serverItem.lastModified;
  const clientModified = clientItem.lastModified;

  const clientHasDescendants = clientItem.descendants?.length > 0;
  const serverHasDescendants = serverItem.descendants?.length > 0;
  let lastModifiedDescendant = clientModified;
  const logPrefix = "mergeDescendantListFromServer:";
  if (clientHasDescendants && serverHasDescendants) {
    const obsoleteDescendants: Array<Draft<ItemDescendantClientStateType> | undefined> = [];
    for (const serverDescendant of serverItem.descendants) {
      let clientDescendant: Draft<ItemDescendantClientStateType> | undefined;
      const descendantLastModified = serverDescendant.lastModified;
      if (serverDescendant.clientId) {
        clientDescendant = clientItem.descendants.find(
          (descendant: ItemDescendantClientStateType) => descendant.clientId === serverDescendant.clientId,
        );
        if (clientDescendant && serverDescendant.disposition === ItemDisposition.Obsoleted) {
          window.consoleLog(logPrefix, "descendant has been deleted:", clientDescendant);
          // FIXME: make sure to remove the descendant on the client
          obsoleteDescendants.push(clientDescendant);
          continue;
        }
        const existingClientDescendant = clientItem.descendants.find(
          (descendant: ItemDescendantClientStateType) => descendant.id === serverDescendant.id,
        );
        if (existingClientDescendant) {
          throw Error(
            logPrefix +
              ` unexpected existing item with id=${existingClientDescendant.id}` +
              JSON.stringify(existingClientDescendant).split("\n", 10).join("\n"),
          );
        }
      } else {
        clientDescendant = clientItem.descendants.find(
          (descendant: ItemDescendantClientStateType) => descendant.id === serverDescendant.id,
        );
      }
      if (clientDescendant && clientItemMatchesServerItem(clientDescendant, serverDescendant)) {
        if (!clientDescendant.id) {
          // Assign the server's id
          clientDescendant.id = serverDescendant.id;
        }

        processServerItemDescendant(clientDescendant, serverDescendant);
      } else {
        // New item from server
        const newDescendant = augmentToItemDescendantClientState({ ...serverDescendant }, clientItem.clientId);
        clientItem.descendants = [...clientItem.descendants, newDescendant];
      }
      lastModifiedDescendant =
        descendantLastModified > lastModifiedDescendant ? descendantLastModified : lastModifiedDescendant;
    }
    // Delete all descendants that have been reported as deleted by the server
    if (obsoleteDescendants.length > 0) {
      window.consoleLog(
        logPrefix,
        `removing ${obsoleteDescendants.length} of ${clientItem.descendants.length} descendants:`,
        obsoleteDescendants.map((descendant) => descendant?.clientId.substring(0, 8)),
      );
      const remainingDescendants = clientItem.descendants.filter(
        (descendant) =>
          !obsoleteDescendants.find((obsoleteDescendant) => obsoleteDescendant?.clientId === descendant.clientId),
      );
      window.consoleLog(
        logPrefix,
        `keeping ${remainingDescendants.length} descendants:`,
        remainingDescendants.map((descendant) => descendant?.clientId.substring(0, 8)),
      );
      clientItem.descendants = remainingDescendants;
    }
    const descendantModel = getDescendantModel(clientItem.itemModel)!;
    const itemOrderFunction = getItemOrderFunction(descendantModel);
    if (itemOrderFunction) {
      clientItem.descendants = sortDescendantsByOrderValues(
        clientItem.descendants as Draft<ItemDescendantOrderableClientStateListType>,
        itemOrderFunction,
      ) as Draft<ItemDescendantOrderableClientStateListType>;
    }
  } else if (clientHasDescendants) {
    // Only the client has descendants.
    // If the server has a more recent item timestamp, we remove the client's descendants
    if (clientModified < serverModified) {
      window.consoleLog(
        logPrefix,
        `SERVER is more recent and provided an empty descendant list: empty descendants of client`,
      );
      clientItem.descendants = [];
    } else {
      window.consoleLog(
        logPrefix,
        `CLIENT is more recent and provided an empty descendant list: keep descendants of client`,
      );
    }
  } else if (serverHasDescendants) {
    // Only the server has descendants
    if (clientModified <= serverModified) {
      window.consoleLog(
        logPrefix,
        `SERVER is more recent and client has no descendants: Initialize with server's descendants`,
      );
      // Descendant list of server initializes the one of the client
      // Before we can use the descendants from the server, we need to
      // augment them with clientIds recursively
      const augmentedServerState = augmentToItemDescendantClientState(serverItem, clientItem.clientId);
      clientItem.descendants = augmentedServerState.descendants;
    }
  } else {
    // Neither server nor client have descendants
    window.consoleLog(logPrefix, `neither server nor client item have descendants`);
  }
}

export function augmentToItemDescendantClientState(
  serverItem: ItemDescendantServerStateType,
  providedParentClientId?: ClientIdType,
  disposition = ItemDisposition.Synced,
): Draft<ItemDescendantClientStateType> {
  // Disposition property is set to `synced` on all items
  const dispositionProperty = {
    disposition,
  };
  const itemModel = serverItem.itemModel;
  const descendantModel = serverItem.descendantModel ?? getDescendantModel(itemModel);
  const modelProperties = {
    itemModel,
    descendantModel,
  };
  const parentClientId = providedParentClientId ?? getClientId(getParentModel(itemModel));
  const clientId = getClientId(itemModel);

  const clientDescendants = serverItem.descendants.map((serverDescendant) => {
    const newDescendant = augmentToItemDescendantClientState(serverDescendant, clientId, disposition);
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

function clientItemMatchesServerItem(
  clientItem: ItemDescendantClientStateType,
  serverItem: ItemDescendantServerStateType,
): boolean {
  if (!clientItem.clientId || !clientItem.parentClientId) {
    throw Error(
      `clientItemMatchesServerItem: clientId=${clientItem.clientId} parentClientId=${clientItem.parentClientId}`,
    );
  }
  if (clientItem.lastModified > serverItem.lastModified) {
    if (!(clientItem.disposition === ItemDisposition.Modified || clientItem.disposition === ItemDisposition.Initial)) {
      throw Error(
        `clientItemMatchesServerItem: clientItem more recent than server but disposition= ${clientItem.disposition}`,
      );
    }
  }
  if (!(clientItem.lastModified instanceof Date) || !(clientItem.createdAt instanceof Date)) {
    throw Error(
      `clientItemMatchesServerItem: clientItem timestamps are not "Date" objects: lastModified is ${typeof clientItem.lastModified} createdAt is ${typeof clientItem.createdAt}`,
    );
  }
  if (clientItem.id === undefined) {
    // For items that have just been sent to the server and are now being returned,
    // matching is based on `clientId` and `parentClientId`
    const newItemMatches = isValidItemId(clientItem.clientId) && clientItem.clientId === serverItem.clientId;
    return newItemMatches;
  } else {
    // Matching is based on `id` and `parentId` for items
    // that have already been persisted on the server
    const existingItemMatches = isValidItemId(clientItem.id) && clientItem.id === serverItem.id;
    if (existingItemMatches) {
      if (!isValidItemId(clientItem.parentId) || clientItem.parentId !== serverItem.parentId) {
        throw Error(`clientItemMatchesServerItem: matching ids but different or invalid parentId`);
      }
    }
    return existingItemMatches;
  }
}

function getDeletedAtProperty(clientItem: ItemDescendantClientStateType, serverItem: ItemDescendantServerStateType) {
  let deletedAtProperty = null;
  if (serverItem?.deletedAt) {
    if (clientItem?.deletedAt) {
      // If both client and server consider the item deleted, the more recent timestamp wins
      deletedAtProperty = serverItem.deletedAt > clientItem.deletedAt ? serverItem.deletedAt : clientItem.deletedAt;

      // Avoid soft deleting client item that has been modified locally
      // later than the time of deletion according to the server
    } else if (clientItem.lastModified < serverItem.deletedAt) {
      // Server has item deleted later than the last modification of the client,
      // so accept it as deleted
      deletedAtProperty = serverItem.deletedAt;
    }
  }
  return deletedAtProperty;
}
