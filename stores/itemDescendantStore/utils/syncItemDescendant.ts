/* eslint-disable @typescript-eslint/no-unused-vars */
// @/stores/itemDescendant/util/syncItemDescendant.ts
import { handleItemDescendantListFromClient } from "@/actions/syncItemDescendant";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { getItemId } from "@/schemas/id";
import { ItemClientStateType, ItemDisposition, ItemServerToClientType } from "@/types/item";
import { getDescendantModel } from "@/types/itemDescendant";
import { ModificationTimestampType } from "@/types/timestamp";
import { Draft } from "immer";
import {
  ItemDescendantClientStateType,
  ItemDescendantHookType,
  ItemDescendantServerStateType,
  ItemDescendantStore,
} from "../createItemDescendantStore";

export async function sendItemDescendantToServer(store: ItemDescendantHookType) {
  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const clientModified = rootState.lastModified;
  const updatedState = await handleItemDescendantListFromClient(rootState);

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
}

function mergeDescendantListFromServer<
  I extends ItemClientStateType,
  C extends ItemClientStateType,
  SI extends ItemServerToClientType,
  SC extends ItemServerToClientType,
>(clientState: Draft<ItemDescendantStore<I, C>>, serverState: ItemDescendantServerStateType<SI, SC>): void {
  // We slap the same disposition property on all descendants
  const dispositionProperty = {
    disposition: ItemDisposition.Synced,
  };

  const itemModel = serverState.descendantModel;
  const descendantModel = itemModel ? getDescendantModel(itemModel) : null;
  const creationProperties = {
    itemModel,
    descendantModel,
    descendants: [],
  };

  const serverModified: ModificationTimestampType = serverState.lastModified;
  const clientModified = clientState.lastModified;

  const clientHasDescendants = clientState.descendants?.length > 0;
  const serverHasDescendants = serverState.descendants?.length > 0;
  if (clientHasDescendants && serverHasDescendants) {
    // Both client and server already have some descendants and we now need to preserve
    // the user's intent.
    //
    // We assume that the server state has been created by the same user, hence
    // has the same or higher chance of being the user's intent.
    //
    // Matching of descendants is based on their `id`, which is generated on the server and
    // stored in items on the client once they have been synced to the server.
    //
    // If an item from the server exists also on the client based on its `id`, then
    // the item with the more recent `lastModified` timestamp wins. If it is from the
    // server, we set the disposition to `Synced`
    // Otherwise, the server's item is augmented with a new `clientId` and
    // then added to the client store, also marked as `Synced`
    //
    // Soft deletion
    // A valid `Date` in `deletetAt` property indicates the user's intent to delete
    // the descendant. However, we only consider this intent if the following
    // prerequisites are met:
    // 1. ... TODO

    const mergedDescendants = [];

    for (const serverDescendant of serverState.descendants) {
      const clientDescendant = clientState.descendants.find((descendant) => descendant.id === serverDescendant.id);
      if (clientDescendant) {
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
          const mergedDescendant = {
            ...clientDescendant,
            ...serverDescendant,
            ...dispositionProperty,
            ...deletedAtProperty,
          } as Draft<ItemDescendantClientStateType<I, C>>;

          // clientState.descendants = clientState.descendants.map((descendant) => {
          //   if (descendant.id === mergedDescendant.id) {
          //     return mergedDescendant;
          //   }
          //   return descendant;
          // });
          mergedDescendants.push(mergedDescendant);
        }
      } else {
        // New item from server
        const newDescendant = {
          ...creationProperties,
          ...serverDescendant,
          ...dispositionProperty,
          parentClientId: clientState.clientId,
          clientId: getItemId(clientState.descendantModel!),
        } as Draft<ItemDescendantClientStateType<I, C>>;
        // clientState.descendants = [...clientState.descendants, newDescendant];
        mergedDescendants.push(newDescendant);
      }
    }
    clientState.descendants = mergedDescendants as Draft<ItemDescendantClientStateType<I, C>>[];
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
        const clientDescendants = serverState.descendants.map(
          (serverDescendant: ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType>) => {
            // New item from server
            const newDescendant = {
              ...serverDescendant,
              ...dispositionProperty,
              parentClientId: clientState.clientId,
              clientId: getItemId(clientState.descendantModel!),
            };
            return newDescendant as ItemDescendantClientStateType<I, C>;
          },
        );
        clientState.descendants = clientDescendants;
      }
    }
  }
}

export function handleItemDescendantListFromServer<
  I extends ItemClientStateType,
  C extends ItemClientStateType,
  SI extends ItemServerToClientType,
  SC extends ItemServerToClientType,
>(clientState: Draft<ItemDescendantStore<I, C>>, serverState: ItemDescendantServerStateType<SI, SC>): void {
  // >(clientState: ItemDescendantStore<I, C>,serverState: ItemDescendantServerStateType<SI, SC>, ): ItemDescendantStore<I, C> | null {

  if (!(clientState.lastModified instanceof Date)) {
    throw Error(
      `handleItemDescendantListFromServer: store has invalid lastModified=${
        clientState.lastModified
      } [${typeof clientState.lastModified}]`,
    );
  }

  // Assuming serverState contains the entire state of the current item (including item properties) and its descendants
  const serverModified: ModificationTimestampType = serverState.lastModified;
  const clientModified = clientState.lastModified;

  const syncMsg =
    "\n" +
    `client: lastModified=${clientModified} descendants=${clientState.descendants?.length}` +
    "\n" +
    `server: lastModified=${serverModified} descendants=${serverState.descendants?.length}`;

  if (serverModified <= clientModified) {
    console.log(`handleItemDescendantListFromServer: CLIENT is more recent`, syncMsg);
    // return null;
    return;
  }

  console.log(`handleItemDescendantListFromServer: SERVER is more recent`, syncMsg);

  // Handle initialization of the client's store: If the store does not have a valid `parentId`,
  // we initialize it to the server's parentId and reset the timestamp to the epoch to ensure
  // the rest of the store will be initialized with the server's state
  if (!clientState.parentId) {
    console.log(
      `handleItemDescendantListFromServer: clientState.parentId is ${typeof clientState.parentId}:`,
      clientState.parentId,
    );
    // mergedState = { ...mergedState, parentId: serverState.parentId, lastModified: new Date(0) };
    clientState.parentId = serverState.parentId;
    clientState.lastModified = new Date(0);
  }

  // Only attempt to merge descendants if the itemModel has a descendant model
  const descendantModel = getDescendantModel(serverState.itemModel);
  if (descendantModel) {
    mergeDescendantListFromServer(clientState, serverState);
  }
  // Update the state of the current item (I) with the server's data
  // Object.assign(mergedState, serverState);
  // Object.assign(clientState, serverState);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { descendants: serverDescendants, ...serverItem } = serverState;

  Object.assign(clientState, serverItem);

  console.log(
    `handleItemDescendantListFromServer: synchronized: serverState.lastModified=${dateToISOLocal(
      serverState.lastModified,
    )} clientState.lastModified=${dateToISOLocal(clientState.lastModified)}:`,
    "\n",
    syncMsg,
    "\nClient state now contains",
    `${clientState.descendants?.length} descendants:`,
    clientState.descendants,
  );
  // return mergedState;
}

export function sanitizeItemDescendantClientState<I extends ItemClientStateType, C extends ItemClientStateType>(
  clientState: Draft<ItemDescendantStore<I, C>>,
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
        console.log(`sanitizeItemDescendantClientState: invalid createdAt:`, item.createdAt);
        item.createdAt = new Date(0);
        item.disposition = ItemDisposition.Modified;
        invalidDates++;
      }
      if (!modifiedValid) {
        console.log(`sanitizeItemDescendantClientState: invalid lastModified:`, item.lastModified);
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
    console.log(
      `sanitizeItemDescendantClientState: ${invalidDates} invalid dates. Reset lastModified to ${clientState.lastModified}`,
    );
  }
}
