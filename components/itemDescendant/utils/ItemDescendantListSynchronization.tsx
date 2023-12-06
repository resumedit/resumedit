// @/components/itemDescendant/ItemDescendantListSynchronization.tsx

"use client";

import { handleItemDescendantListFromClient } from "@/actions/syncItemDescendant";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { useSyncItemDescendantList } from "@/hooks/useSyncItemDescendantList";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { keepOnlyStateForServer } from "@/stores/itemDescendantStore/utils/syncItemDescendant";
import { ItemClientToServerType } from "@/types/item";
import { useRef } from "react";

export function ItemDescendantListSynchronization() {
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);

  const synchronizeButtonRef = useRef<HTMLButtonElement>(null);

  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  async function sendItemDescendantToServer(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!rootState) {
      throw Error(`sendItemDescendantToServer(): storeName=${storeName}, rootState=${rootState})`);
    }

    const clientToServerState = keepOnlyStateForServer<ItemClientToServerType>(rootState);
    console.log(
      `ItemDescendantListSynchronization:sendItemDescendantToServer:clientToServerState:`,
      clientToServerState,
    );

    const clientModified = clientToServerState.lastModified;
    const updatedItemList = await handleItemDescendantListFromClient(clientToServerState);

    if (updatedItemList) {
      updateStoreWithServerData(updatedItemList);
      const serverModified = updatedItemList.lastModified;

      if (serverModified > clientModified) {
        toast({
          title: `Synchronized`,
          description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
            clientToServerState.descendants.length
          }\nServer: ${dateToISOLocal(serverModified)}: ${updatedItemList.descendants.length}`,
        });
      }
    }
  }

  useSyncItemDescendantList();

  return !store ? null : (
    <div>
      <form
        className="py-2 mt-8 bg-elem-light dark:bg-elem-dark-1 flex items-center gap-x-3 rounded-md"
        name="setSyncIntervalForm"
      >
        <Button onClick={sendItemDescendantToServer} ref={synchronizeButtonRef}>
          Sync now
        </Button>
      </form>
    </div>
  );
}
