// @/stores/parentItemList/util/syncParentItemList.ts
import { getItemId } from "@/schemas/id";
import { ItemClientStateType, ItemDisposition, ItemServerToClientType } from "@/types/item";
import { ParentItemListStore, ParentItemListType } from "@/types/parentItemList";
import { ModificationTimestampType } from "@/types/timestamp";
import { Draft } from "immer";

import { getItemLastModified } from "@/actions/parentItemList";
import { handleParentItemListFromClient } from "@/actions/syncParentItemList";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { ItemClientToServerType } from "@/types/item";
import { ParentItemListHookType } from "@/types/parentItemList";

export async function sendParentItemLisToServer(store: ParentItemListHookType) {
  const parent = store((state) => state.parent);
  const itemModel = store((state) => state.itemModel);
  const items = store((state) => state.items);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const clientList = { parent, items } as ParentItemListType<ItemClientToServerType, ItemClientToServerType>;
  if (clientList.parent) {
    const clientModified = clientList.parent?.lastModified;
    const updatedItemList = await handleParentItemListFromClient(itemModel, clientList);

    if (updatedItemList) {
      updateStoreWithServerData(updatedItemList);
      const parentId = clientList.parent.id!;
      const serverModified = await getItemLastModified(itemModel, parentId);

      if (serverModified > clientModified) {
        toast({
          title: `Synchronized`,
          description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
            clientList.items.length
          }\nServer: ${dateToISOLocal(new Date(updatedItemList.parent.lastModified))}: ${updatedItemList.items.length}`,
        });
      }
    }
  }
}

export function handleParentItemListFromServer<
  SP extends ItemServerToClientType,
  SI extends ItemServerToClientType,
  P extends ItemClientStateType,
  I extends ItemClientStateType,
>(clientState: Draft<ParentItemListStore<P, I>>, serverState: ParentItemListType<SP, SI>): void {
  if (!serverState.parent) {
    throw Error(`updateStoreWithServerData: invalid parent=${clientState.parent}`);
  }

  // Declare a non-null variable to represent the server's `parent` and overwrite the `parent` property
  const serverModified: ModificationTimestampType = serverState.parent.lastModified!;

  // Handle initialization of the client's store: If the store does not have a valid `parent`,
  // we initialize it to the server's parent, but we reset the timestamp to the epoch to ensure
  // the store will be initialized to the server's state
  if (
    !clientState.parent /* || !clientState.parent.lastModified || !(clientState.parent.lastModified instanceof Date) */
  ) {
    /*
    if (clientState.parent) {
      console.log(
        `handleParentItemListFromServer: clientState.parent.lastModified is ${typeof clientState.parent.lastModified}:`,
        clientState.parent.lastModified,
      );
      clientState.parent = {
        ...clientState.parent,
        lastModified: new Date(clientState.parent.lastModified),
      } as Draft<P>;
    } else  { */
    console.log(
      `handleParentItemListFromServer: clientState.parent is ${typeof clientState.parent}:`,
      clientState.parent,
    );

    clientState.parent = { ...serverState.parent, lastModified: new Date(0) } as Draft<P>;
    // }
  }

  const clientModified = clientState.parent.lastModified;

  const syncMsg =
    "\n" +
    `parent.lastModified=${clientModified} items=${clientState.items.length}` +
    `server: parent.lastModified=${serverModified} items=${serverState.items.length}`;

  if (serverModified <= clientModified) {
    console.log(
      `handleParentItemListFromServer: CLIENT is more recent: server.lastModified=${dateToISOLocal(
        serverModified,
      )} <= client.lastModified=${dateToISOLocal(clientModified)}:`,
      syncMsg,
    );
    // sanitizeParentItemListClientState(clientState);
    return;
  }

  console.log(
    `handleParentItemListFromServer: SERVER is more recent: server.lastModified=${dateToISOLocal(
      serverModified,
    )} > client.lastModified=${dateToISOLocal(clientModified)}:`,
    syncMsg,
  );

  // Merge strategy:
  // Everything is based on the `id`, which is generated on the server and
  // stored in items on the client once they have been synced to the server.
  // If an item from the server exists also on the client based on its `id`, then
  // the item with the more recent `lastModified` timestamp wins. If it is from the
  // server, we set the disposition to `Synced`
  // Otherwise, the server's item is augmented with a new `clientId` and
  // then added to the client store, also marked as `Synced`
  const items = serverState.items.map((serverItem): I => {
    const dispositionProperty = {
      disposition: ItemDisposition.Synced,
    };
    const clientItem: I | undefined = clientState.items.find((a) => a.id === serverItem.id) as I;
    if (clientItem) {
      // If local lastModified is more recent, keep local changes
      if (clientItem.lastModified > serverItem.lastModified) {
        if (clientItem.disposition !== ItemDisposition.Modified) {
          throw Error(
            `handleParentItemListFromServer: clientItem more recent than server but disposition= ${clientItem.disposition}`,
          );
        }
        return clientItem;
      } else {
        // Server version is more recent or equal
        let deletedAtProperty = {
          deletedAt: serverItem.deletedAt || null,
        };
        if (serverItem?.deletedAt) {
          if (clientItem?.deletedAt) {
            deletedAtProperty = {
              ...deletedAtProperty,
              deletedAt: serverItem.deletedAt > clientItem.deletedAt ? serverItem.deletedAt : clientItem.deletedAt,
            };
          } else if (clientItem.lastModified > serverItem.deletedAt) {
            // Avoid soft deleting client item that has been modified locally
            // later than the time of deletion according to the server
            deletedAtProperty = { ...deletedAtProperty, deletedAt: null };
          }
        }
        return { ...clientItem, ...serverItem, ...dispositionProperty, ...deletedAtProperty };
      }
    } else {
      // New item from server
      return { clientId: getItemId(), ...serverItem, ...dispositionProperty } as unknown as I;
    }
  });

  clientState.items = items as Draft<I>[];
  clientState.parent = { ...clientState.parent, lastModified: serverState.parent.lastModified as Date };
  clientState.serverModified = serverState.parent.lastModified as Date;
  console.log(
    `handleParentItemListFromServer: synchronized: serverState.parent.lastModified=${dateToISOLocal(
      serverState.parent.lastModified,
    )} clientState.parent.lastModified=${dateToISOLocal(clientState.parent.lastModified)}:`,
    syncMsg,
  );
}

export function sanitizeParentItemListClientState<P extends ItemClientStateType, I extends ItemClientStateType>(
  clientState: Draft<ParentItemListStore<P, I>>,
): void {
  let invalidDates = 0;
  clientState.items.forEach((item) => {
    const parentModified = clientState.parent?.lastModified;
    const createdValid = item.createdAt instanceof Date;
    const modifiedValid = item.lastModified instanceof Date;
    if (createdValid && modifiedValid) {
      if (parentModified && item.lastModified > parentModified) {
        clientState.parent!.lastModified! = item.lastModified;
      }
      if (item.id) {
        item.disposition = ItemDisposition.Synced;
      } else {
        item.disposition = ItemDisposition.New;
      }
    } else {
      if (!createdValid) {
        console.log(`useParentItemListStore/updateStoreWithServerData: invalid createdAt:`, item.createdAt);
        item.createdAt = new Date(0);
        item.disposition = ItemDisposition.Modified;
        invalidDates++;
      }
      if (!modifiedValid) {
        console.log(`useParentItemListStore/updateStoreWithServerData: invalid lastModified:`, item.lastModified);
        item.lastModified = new Date(0);
        item.disposition = ItemDisposition.Modified;
        invalidDates++;
      }
    }
    if (item.deletedAt) {
      if (item.deletedAt < item.createdAt) {
        item.deletedAt = item.createdAt;
      }
    }
  });
  if (invalidDates > 0) {
    if (clientState.parent) {
      clientState.parent = { ...clientState.parent, lastModified: new Date(0) };
      console.log(
        `useParentItemListStore/updateStoreWithServerData: ${invalidDates} invalid dates. Reset parent.lastModified to ${clientState.parent.lastModified}`,
      );
    }
  }
}
