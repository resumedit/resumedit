// @/stores/itemDescendant/util/syncItemDescendant.ts

import { handleNestedItemDescendantListFromClient } from "@/actions/syncItemDescendant";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { getItemId, isValidItemId } from "@/schemas/id";
import { ItemDescendantServerStateType } from "@/schemas/itemDescendant";
import { ClientIdType, ItemClientStateType, ItemDisposition } from "@/types/item";
import { getDescendantModel, keepOnlyStateForServer } from "@/types/itemDescendant";
import { ModificationTimestampType } from "@/types/timestamp";
import { Draft } from "immer";
import { ItemDescendantClientStateType, ItemDescendantStore } from "../createItemDescendantStore";

function validateClientItem(
  clientItem: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  serverItem: ItemDescendantServerStateType,
) {
  if (!clientItem.clientId || !clientItem.parentClientId) {
    throw Error(
      `mergeDescendantListFromServer: clientId=${clientItem.clientId} parentClientId=${clientItem.parentClientId}`,
    );
  }
  if (clientItem.lastModified > serverItem.lastModified) {
    if (clientItem.disposition !== ItemDisposition.Modified) {
      throw Error(
        `mergeDescendantListFromServer: clientDescendant more recent than server but disposition= ${clientItem.disposition}`,
      );
    }
  }
  return true;
}

function getDeletedAtProperty(
  clientItem: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
  serverItem: ItemDescendantServerStateType,
) {
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

export async function syncItemDescendantStoreWithServer(
  store: ItemDescendantStore<ItemClientStateType, ItemClientStateType>,
  updateStoreWithServerData: (serverState: ItemDescendantServerStateType) => void,
): Promise<ItemDescendantServerStateType | Date> {
  const clientModified = store.lastModified;
  const rootState = keepOnlyStateForServer(store);
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

function updateClientItemWithServerItem(
  clientItem: Draft<ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>>,
  serverItem: ItemDescendantServerStateType,
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { lastModified: serverModified, descendants: serverDescendants, ...serverUpdate } = serverItem;

  // Directly mutate the properties of clientItem
  Object.assign(clientItem, serverUpdate);

  // Set disposition to `Synced` and clear descendants
  clientItem.disposition = ItemDisposition.Synced;
  clientItem.descendants = [];

  window.consoleLog(
    `updateClientItemWithServerItem: updated original clientItem`,
    "\n",
    clientItem,
    "\nto\n",
    serverUpdate,
  );
}

function augmentItemDescendantRecursively(
  serverItem: ItemDescendantServerStateType,
  parentClientId: ClientIdType,
): Draft<ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>> {
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

  const clientId = getItemId(itemModel!);

  const clientDescendants = serverItem.descendants.map((serverDescendant: ItemDescendantServerStateType) => {
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
  return clientItem as Draft<ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>>;
}

function mergeDescendantListFromServer<I extends ItemClientStateType, C extends ItemClientStateType>(
  clientState: Draft<ItemDescendantClientStateType<I, C>>,
  serverState: ItemDescendantServerStateType,
): void {
  const serverModified: ModificationTimestampType = serverState.lastModified;
  const clientModified = clientState.lastModified;

  const clientHasDescendants = clientState.descendants?.length > 0;
  const serverHasDescendants = serverState.descendants?.length > 0;
  if (clientHasDescendants && serverHasDescendants) {
    for (const serverDescendant of serverState.descendants) {
      let clientDescendant;
      if (serverDescendant.clientId) {
        clientDescendant = clientState.descendants.find(
          (descendant) => descendant.clientId === serverDescendant.clientId,
        );
      } else {
        clientDescendant = clientState.descendants.find((descendant) => descendant.id === serverDescendant.id);
      }
      if (clientDescendant && validateClientItem(clientDescendant, serverDescendant)) {
        if (!clientDescendant.id) {
          // Assign the server's id
          clientDescendant.id = serverDescendant.id;
        }

        // Update if server is more recent
        if (serverDescendant.lastModified > clientDescendant.lastModified) {
          // Server version is more recent
          // Before merging the descendant, we need to descend into the next level down
          mergeDescendantListFromServer(clientDescendant, serverDescendant);
        }
        clientState = { ...clientState, deletedAt: getDeletedAtProperty(clientDescendant, serverDescendant) };
      } else {
        // New item from server
        const newDescendant = augmentItemDescendantRecursively({ ...serverDescendant }, clientState.clientId);
        clientState.descendants = [...clientState.descendants, newDescendant];
      }
    }
  } else if (clientHasDescendants) {
    // Only the client has descendants.
    // If the server has a more recent item timestamp, we remove the client's descendants
    if (clientModified < serverModified) {
      console.log(
        `mergeDescendantListFromServer: SERVER is more recent and provided an empty descendant list: empty descendants of client`,
      );
      clientState.descendants = [];
    }
  } else if (serverHasDescendants) {
    // Only the server has descendants
    if (clientModified <= serverModified) {
      console.log(
        `mergeDescendantListFromServer: SERVER is more recent and client has no descendants: Initialize with server's descendants`,
      );
      // Descendant list of server initializes the one of the client
      // Before we merge this new descendant from the server, we need to
      // augment its descendant list with clientIds recursively
      const augmentedServerState = augmentItemDescendantRecursively(serverState, clientState.clientId);
      Object.assign(clientState, augmentedServerState);
    }
  } else {
    // Neither server nor client have descendants
    console.log(`mergeDescendantListFromServer: neither server nor client item have descendants`);
  }
}

export function handleItemDescendantFromServer<I extends ItemClientStateType, C extends ItemClientStateType>(
  clientState: Draft<ItemDescendantStore<I, C>>,
  serverState: ItemDescendantServerStateType,
  logUpdateFromServer = false,
): void {
  if (!(clientState.lastModified instanceof Date)) {
    throw Error(
      `handleItemDescendantFromServer: store has invalid lastModified=${
        clientState.lastModified
      } [${typeof clientState.lastModified}]`,
    );
  }

  // First determine, whether the local store corresponds to the serverState
  if (
    isValidItemId(clientState.id) &&
    isValidItemId(clientState.parentId) &&
    clientState.id === serverState.id &&
    clientState.parentId === serverState.parentId
  ) {
    // Determine if the server is aware of any changes that happened after the last local modification
    const serverModified: ModificationTimestampType = serverState.lastModified;
    const clientModified = clientState.lastModified;

    const syncMsg =
      "\n" +
      `client: lastModified=${clientModified} descendants=${clientState.descendants?.length}` +
      "\n" +
      `server: lastModified=${serverModified} descendants=${serverState.descendants?.length}`;

    if (serverModified > clientModified) {
      if (logUpdateFromServer) {
        console.log(`handleItemDescendantFromServer: SERVER is more recent`, syncMsg);
      }
    } else {
      // Server confirms to have applied all modifications from the client (if any)
      // and there are no modifications that happened more recently
      if (logUpdateFromServer) {
        console.log(`handleItemDescendantFromServer: CLIENT is up to date with server`, syncMsg);
      }
      // Even though client is up to date, we still need to set the `disposition` of all items
      // with a lastMofified timestamp equal or older to that of the server to `Synced`
    }
  } else {
    // Handle initialization of the client's store: reset the `lastModified` timestamp to the epoch
    // to ensure that the rest of the store will be initialized with the server's state
    if (logUpdateFromServer) {
      console.log(
        `handleItemDescendantFromServer: SERVER id=${serverState.id} replaces client item with id=${clientState.id}`,
      );
      console.log(
        `handleItemDescendantFromServer: clientState.parentId is ${typeof clientState.parentId}:`,
        clientState.parentId,
      );
    }
    clientState.lastModified = new Date(0);
  }

  // Update the state of the current item with the server's data
  // Obtain a copy of the serverState but exclue `lastModified` and `descendants`,
  // as those properties require separate handling
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const { lastModified: serverModified, descendants: serverDescendants, ...serverItem } = serverState;
  // Object.assign(clientState, serverItem);
  updateClientItemWithServerItem(clientState, serverState);

  // Only attempt to merge descendants if the itemModel has a descendant model
  const descendantModel = getDescendantModel(serverState.itemModel);
  if (descendantModel) {
    mergeDescendantListFromServer(clientState, serverState);
  }

  // Update timestamp to server's `lastModified`
  clientState.lastModified = serverState.lastModified;

  if (logUpdateFromServer) {
    console.log(
      `handleItemDescendantFromServer: synchronized: serverState.lastModified=${dateToISOLocal(
        serverState.lastModified,
      )} clientState.lastModified=${dateToISOLocal(clientState.lastModified)}:`,
      "\nClient state now contains",
      `${clientState.descendants?.length} descendants:`,
      clientState.descendants,
    );
  }
}

export function sanitizeItemDescendantClientState<I extends ItemClientStateType, C extends ItemClientStateType>(
  clientState: Draft<ItemDescendantStore<I, C>>,
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
          console.log(`sanitizeItemDescendantClientState: invalid createdAt:`, item.createdAt);
        }
        item.createdAt = new Date(0);
        item.disposition = ItemDisposition.Modified;
        invalidDates++;
      }
      if (!modifiedValid) {
        if (logUpdateFromServer) {
          console.log(`sanitizeItemDescendantClientState: invalid lastModified:`, item.lastModified);
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
      console.log(
        `sanitizeItemDescendantClientState: ${invalidDates} invalid dates. Reset lastModified to ${clientState.lastModified}`,
      );
    }
  }
}
