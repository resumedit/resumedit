import { handleParentItemListFromClient } from "@/actions/syncParentItemList";
import { toast } from "@/components/ui/use-toast";
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { ItemClientToServerType } from "@/types/item";
import { ParentItemListStoreNameType, ParentItemListType } from "@/types/parentItemList";
import { useCallback, useEffect } from "react";

export function useSyncParentItemList() {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const synchronizationInterval = store((state) => state.synchronizationInterval);

  const parent = store((state) => state.parent);
  const items = store((state) => state.items);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const syncItems = useCallback(async () => {
    // Send the entire item list
    const clientList = { parent, items } as ParentItemListType<ItemClientToServerType, ItemClientToServerType>;
    if (clientList.parent) {
      const clientModified = clientList.parent.lastModified;
      const updatedItemList = await handleParentItemListFromClient(
        storeName as ParentItemListStoreNameType,
        clientList,
      );

      if (updatedItemList) {
        updateStoreWithServerData(updatedItemList);
        const serverModified = updatedItemList.parent.lastModified;

        if (serverModified > clientModified) {
          toast({
            title: `Synchronized`,
            description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
              clientList.items.length
            }\nServer: ${dateToISOLocal(new Date(updatedItemList.parent.lastModified))}: ${
              updatedItemList.items.length
            }`,
          });
        }
      }
    }
  }, [items, parent, storeName, updateStoreWithServerData]);

  useEffect(() => {
    if (synchronizationInterval > 0) {
      const intervalId = setInterval(syncItems, synchronizationInterval * 1000);
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [syncItems, synchronizationInterval]);
}
