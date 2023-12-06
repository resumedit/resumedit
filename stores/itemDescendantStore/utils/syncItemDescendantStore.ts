// @/stores/itemDescendant/util/syncItemDescendant.ts

import { handleNestedItemDescendantListFromClient } from "@/actions/syncItemDescendant";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { stripFields } from "@/lib/utils/misc";
import { getItemId, isValidItemId } from "@/schemas/id";
import { ClientIdType, ItemClientStateType, ItemDisposition, ItemServerStateType } from "@/types/item";
import { getDescendantModel } from "@/types/itemDescendant";
import { ModificationTimestampType } from "@/types/timestamp";
import { Draft } from "immer";
import {
  ItemDescendantClientStateType,
  ItemDescendantServerStateType,
  ItemDescendantStore,
} from "../createItemDescendantStore";

export function keepOnlyStateForServer<T extends ItemDescendantStore<ItemClientStateType, ItemClientStateType>>(
  rootState: T,
) {
  // Remove all properties that are not part of the item
  const storeActions: Array<keyof T> = [
    "setItemData",
    "markItemAsDeleted",
    "restoreDeletedItem",
    "getDescendants",
    "setDescendantData",
    "markDescendantAsDeleted",
    "reArrangeDescendants",
    "resetDescendantsOrderValues",
    "getDescendantDraft",
    "updateDescendantDraft",
    "commitDescendantDraft",
    "updateStoreWithServerData",
  ];
  const nonItemRootStateProperties: Array<keyof T> = ["descendantDraft"];

  // Combine both sets of keys to remove
  const fieldsToStrip = new Set<keyof T>([...storeActions, ...nonItemRootStateProperties]);

  const payload = stripFields(rootState, fieldsToStrip);
  return payload as ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>;
}

export async function syncItemDescendantStoreWithServer(
  store: ItemDescendantStore<ItemClientStateType, ItemClientStateType>,
  updateStoreWithServerData: (
    serverState: ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType>,
  ) => void,
): Promise<ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType> | null> {
  const clientModified = store.lastModified;
  const rootState = keepOnlyStateForServer(store);
  const updatedState = await handleNestedItemDescendantListFromClient(rootState);

  if (updatedState) {
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

function augmentItemFromServer<SI extends ItemServerStateType, SC extends ItemServerStateType>(
  serverItem: ItemDescendantServerStateType<SI, SC>,
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

  const clientDescendants = serverItem.descendants.map(
    (serverDescendant: ItemDescendantServerStateType<ItemServerStateType, ItemServerStateType>) => {
      const newDescendant = augmentItemFromServer(serverDescendant, clientId);
      return newDescendant as ItemDescendantClientStateType<SI, SC>;
    },
  );

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

function mergeDescendantListFromServer<
  I extends ItemClientStateType,
  C extends ItemClientStateType,
  SI extends ItemServerStateType,
  SC extends ItemServerStateType,
>(clientState: Draft<ItemDescendantClientStateType<I, C>>, serverState: ItemDescendantServerStateType<SI, SC>): void {
  // const itemModel = serverState.descendantModel;
  // const descendantModel = itemModel ? getDescendantModel(itemModel) : null;
  // const creationProperties = {
  //   itemModel,
  //   descendantModel,
  //   descendants: [],
  // };

  const serverModified: ModificationTimestampType = serverState.lastModified;
  const clientModified = clientState.lastModified;

  const clientHasDescendants = clientState.descendants?.length > 0;
  const serverHasDescendants = serverState.descendants?.length > 0;
  if (clientHasDescendants && serverHasDescendants) {
    /*
    Both client and server already have some descendants and we now need to preserve
    the user's intent.
    
    We assume that the server state has been created by the same user, hence
    has the same or higher chance of being the user's intent.
    
    Matching of descendants created on this client is based on their `clientId`, 
    which is generated on the client and returned to the client that sent the descendant,
    but the clientId is never stored on the server.
    The client stops sending the clientId to the server after having received an
    updated descendant that matches the clientId. based on this matching, the client then 
    assigns the id generated by the server.
    
    Hence, for every descendant from the server, the client determines if it has a clientId.
    WITH CLIENTID:
        If the server's descendant has a clientId, the client tries to match it based on 
        this identifier.
        In case it cannot find a matching descendant, it creates a new one matching the server's id
    
    WITHOUT CLIENTID:
        If the server's descendant does not have a clientId, then it either already exists
        on the client or it has been created on a different client.
        If it exists, the version with the more recent `lastModified` timestamp wins. If it
        is from the server, we set the disposition to `Synced`
        If no match is found based on the server's id, the server's descendant is augmented 
        with a new `clientId` and
        then added to the client store, also marked as `Synced`
    
    If an descendant from the server exists also on the client based on its `id`, then
    the descendant with the more recent `lastModified` timestamp wins. If it is from the
    server, we set the disposition to `Synced`
    Otherwise, the server's descendant is augmented with a new `clientId` and
    then added to the client store, also marked as `Synced`
    
    Soft deletion
    A valid `Date` in `deletetAt` property indicates the user's intent to delete
    the descendant. However, we only consider this intent if the following
    prerequisites are met:
    1. ... TODO
    */

    for (const serverDescendant of serverState.descendants) {
      let clientDescendant;
      if (serverDescendant.clientId) {
        clientDescendant = clientState.descendants.find(
          (descendant) => descendant.clientId === serverDescendant.clientId,
        );
      } else {
        clientDescendant = clientState.descendants.find((descendant) => descendant.id === serverDescendant.id);
      }
      if (clientDescendant) {
        if (!clientDescendant.id) {
          // Assign the server's id
          clientDescendant.id = serverDescendant.id;
        }
        // If local lastModified is more recent, keep local changes
        if (clientDescendant.lastModified > serverDescendant.lastModified) {
          if (clientDescendant.disposition !== ItemDisposition.Modified) {
            throw Error(
              `mergeDescendantListFromServer: clientDescendant more recent than server but disposition= ${clientDescendant.disposition}`,
            );
          }
        } else {
          // Server version is more recent or equal
          let deletedAtProperty = {
            deletedAt: serverDescendant.deletedAt || null,
          };
          if (serverDescendant?.deletedAt) {
            if (clientDescendant?.deletedAt) {
              deletedAtProperty = {
                ...deletedAtProperty,
                deletedAt:
                  serverDescendant.deletedAt > clientDescendant.deletedAt
                    ? serverDescendant.deletedAt
                    : clientDescendant.deletedAt,
              };
            } else if (clientDescendant.lastModified > serverDescendant.deletedAt) {
              // Avoid soft deleting client item that has been modified locally
              // later than the time of deletion according to the server
              deletedAtProperty = { ...deletedAtProperty, deletedAt: null };
            }
          }
          if (!clientDescendant.clientId || !clientDescendant.parentClientId) {
            console.log(
              `mergeDescendantListFromServer: clientId=${clientDescendant.clientId} parentClientId=${clientDescendant.parentClientId}`,
            );
          }
          // Before merging the descendant, we need to descend into the next level down
          mergeDescendantListFromServer(clientDescendant, serverDescendant);
        }
      } else {
        // New item from server
        const newDescendant = augmentItemFromServer({ ...serverDescendant }, clientState.clientId);

        clientState.descendants = [...clientState.descendants, newDescendant];
      }
    }
  } else {
    if (clientHasDescendants) {
      // Only the client has descendants. If the server has more recent
      // item timestamp, we remove the client's descendants
      if (clientModified < serverModified) {
        console.log(
          `mergeDescendantListFromServer: SERVER is more recent and provided an empty descendant list: empty descendants of client`,
        );
        clientState.descendants = [];
      }
    } else {
      // Only the server has descendants
      if (clientModified <= serverModified) {
        console.log(
          `mergeDescendantListFromServer: SERVER is more recent and client has no descendants: Initialize with server's descendants`,
        );
        // Descendant list of server initializes the one of the client
        // Before we merge this new descendant from the server, we need to
        // augment its descendant list with clientIds recursively
        const augmentedServerState = augmentItemFromServer(serverState, clientState.clientId);
        Object.assign(clientState, augmentedServerState);
      }
    }
  }
}

export function handleItemDescendantListFromServer<
  I extends ItemClientStateType,
  C extends ItemClientStateType,
  SI extends ItemServerStateType,
  SC extends ItemServerStateType,
>(
  clientState: Draft<ItemDescendantStore<I, C>>,
  serverState: ItemDescendantServerStateType<SI, SC>,
  logUpdateFromServer = false,
): void {
  if (!(clientState.lastModified instanceof Date)) {
    throw Error(
      `handleItemDescendantListFromServer: store has invalid lastModified=${
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
    // serverState contains the entire state of the current item, i.e., item properties and descendants
    const serverModified: ModificationTimestampType = serverState.lastModified;
    const clientModified = clientState.lastModified;

    const syncMsg =
      "\n" +
      `client: lastModified=${clientModified} descendants=${clientState.descendants?.length}` +
      "\n" +
      `server: lastModified=${serverModified} descendants=${serverState.descendants?.length}`;

    if (serverModified <= clientModified) {
      if (logUpdateFromServer) {
        console.log(`handleItemDescendantListFromServer: CLIENT is more recent`, syncMsg);
      }
      // return null;
      return;
    }
    if (logUpdateFromServer) {
      console.log(`handleItemDescendantListFromServer: SERVER is more recent`, syncMsg);
    }
  } else {
    // Handle initialization of the client's store: reset the `lastModified` timestamp to the epoch
    // to ensure that the rest of the store will be initialized with the server's state
    if (logUpdateFromServer) {
      console.log(
        `handleItemDescendantListFromServer: SERVER id=${serverState.id} replaces client item with id=${clientState.id}`,
      );
      console.log(
        `handleItemDescendantListFromServer: clientState.parentId is ${typeof clientState.parentId}:`,
        clientState.parentId,
      );
    }
    clientState.lastModified = new Date(0);
  }

  // Update the state of the current item with the server's data
  // Obtain a copy of the serverState but exclue `lastModified` and `descendants`,
  // as those properties require separate handling
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { lastModified: serverModified, descendants: serverDescendants, ...serverItem } = serverState;
  Object.assign(clientState, serverItem);

  // Only attempt to merge descendants if the itemModel has a descendant model
  const descendantModel = getDescendantModel(serverState.itemModel);
  if (descendantModel) {
    mergeDescendantListFromServer(clientState, serverState);
  }

  // Update timestamp to server's `lastModified`
  clientState.lastModified = serverState.lastModified;

  if (logUpdateFromServer) {
    console.log(
      `handleItemDescendantListFromServer: synchronized: serverState.lastModified=${dateToISOLocal(
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
