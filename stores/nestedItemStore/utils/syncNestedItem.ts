// @/stores/nestedItem/util/syncNestedItem.ts
import { getItemId } from "@/schemas/id";
import {
  NestedItemDescendantClientStateType,
  NestedItemDisposition,
  NestedItemListType,
  NestedItemServerToClientType,
} from "@/types/nestedItem";
import { ModificationTimestampType } from "@/types/timestamp";
import { Draft } from "immer";
import { NestedItemStore } from "../createNestedItemStore";

import { handleNestedItemListFromClient } from "@/actions/syncNestedItemList";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { NestedItemHookType } from "../createNestedItemStore";

export async function sendNestedItemToServer(store: NestedItemHookType) {
  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const clientModified = rootState.lastModified;
  const updatedState = await handleNestedItemListFromClient(rootState);

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

export function handleNestedItemListFromServer<
  SI extends NestedItemServerToClientType,
  SC extends NestedItemServerToClientType,
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
>(clientState: Draft<NestedItemStore<I, C>>, serverState: NestedItemListType<SI, SC>): void {
  // Assuming serverState contains the entire state of the current item (including parent properties) and its descendants
  const serverModified: ModificationTimestampType = serverState.lastModified;

  const clientModified = clientState.lastModified;

  const syncMsg =
    "\n" +
    `client: lastModified=${clientModified} descendants=${clientState.descendants?.length}` +
    "\n" +
    `server: lastModified=${serverModified} descendants=${serverState.descendants?.length}`;

  if (serverModified <= clientModified) {
    console.log(`handleNestedItemListFromServer: CLIENT is more recent`, syncMsg);
    return;
  }

  console.log(`handleNestedItemListFromServer: SERVER is more recent`, syncMsg);

  // Handle initialization of the client's store: If the store does not have a valid `parentId`,
  // we initialize it to the server's parentId and reset the timestamp to the epoch to ensure
  // the rest of the store will be initialized with the server's state
  if (!clientState.parentId) {
    console.log(
      `handleNestedItemListFromServer: clientState.parentId is ${typeof clientState.parentId}:`,
      clientState.parentId,
    );
    clientState = { ...clientState, parentId: serverState.parentId, lastModified: new Date(0) };
  }

  let mergedDescendants;
  if (serverState.descendants?.length > 0) {
    // Merge strategy:
    // Everything is based on the `id`, which is generated on the server and
    // stored in items on the client once they have been synced to the server.
    // If an item from the server exists also on the client based on its `id`, then
    // the item with the more recent `lastModified` timestamp wins. If it is from the
    // server, we set the disposition to `Synced`
    // Otherwise, the server's item is augmented with a new `clientId` and
    // then added to the client store, also marked as `Synced`
    mergedDescendants = serverState.descendants.map((serverChild: SC): C => {
      const clientChild: C | undefined = clientState.descendants.find((child) => child.id === serverChild.id) as C;
      const dispositionProperty = {
        disposition: NestedItemDisposition.Synced,
      };
      if (clientChild) {
        // If local lastModified is more recent, keep local changes
        if (clientChild.lastModified > serverChild.lastModified) {
          if (clientChild.disposition !== NestedItemDisposition.Modified) {
            throw Error(
              `handleNestedItemListFromServer: clientChild more recent than server but disposition= ${clientChild.disposition}`,
            );
          }
          return clientChild;
        } else {
          // Server version is more recent or equal
          let deletedAtProperty = {
            deletedAt: serverChild.deletedAt || null,
          };
          if (serverChild?.deletedAt) {
            if (clientChild?.deletedAt) {
              deletedAtProperty = {
                ...deletedAtProperty,
                deletedAt:
                  serverChild.deletedAt > clientChild.deletedAt ? serverChild.deletedAt : clientChild.deletedAt,
              };
            } else if (clientChild.lastModified > serverChild.deletedAt) {
              // Avoid soft deleting client item that has been modified locally
              // later than the time of deletion according to the server
              deletedAtProperty = { ...deletedAtProperty, deletedAt: null };
            }
          }
          return { ...clientChild, ...serverChild, ...dispositionProperty, ...deletedAtProperty };
        }
      } else {
        // New item from server
        return { clientId: getItemId(), ...serverChild, ...dispositionProperty } as unknown as C;
      }
    });
  }

  // Update the state of the current item (I) with the server's data
  Object.assign(clientState, serverState);

  if (mergedDescendants) {
    clientState.descendants = mergedDescendants as Draft<C>[];
  }
  console.log(
    `handleNestedItemListFromServer: synchronized: serverState.lastModified=${dateToISOLocal(
      serverState.lastModified,
    )} clientState.lastModified=${dateToISOLocal(clientState.lastModified)}:`,
    syncMsg,
  );
}

export function sanitizeNestedItemClientState<
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
>(clientState: Draft<NestedItemStore<I, C>>): void {
  let invalidDates = 0;
  clientState.descendants.forEach((item) => {
    const createdValid = item.createdAt instanceof Date;
    const modifiedValid = item.lastModified instanceof Date;
    if (createdValid && modifiedValid) {
      if (item.lastModified > clientState.lastModified) {
        clientState.lastModified = item.lastModified;
      }
      if (item.id) {
        item.disposition = NestedItemDisposition.Synced;
      } else {
        item.disposition = NestedItemDisposition.New;
      }
    } else {
      if (!createdValid) {
        console.log(`sanitizeNestedItemClientState: invalid createdAt:`, item.createdAt);
        item.createdAt = new Date(0);
        item.disposition = NestedItemDisposition.Modified;
        invalidDates++;
      }
      if (!modifiedValid) {
        console.log(`sanitizeNestedItemClientState: invalid lastModified:`, item.lastModified);
        item.lastModified = new Date(0);
        item.disposition = NestedItemDisposition.Modified;
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
      `sanitizeNestedItemClientState: ${invalidDates} invalid dates. Reset lastModified to ${clientState.lastModified}`,
    );
  }
}
