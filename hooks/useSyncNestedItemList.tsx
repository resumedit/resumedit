import { handleNestedItemListFromClient } from "@/actions/syncNestedItemL";
import { toast } from "@/components/ui/use-toast";
import { useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { NestedItemState } from "@/stores/nestedItemStore/createNestedItemStore";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { NestedItemDescendantClientStateType } from "@/types/nestedItem";
import { useCallback, useEffect } from "react";

export function useSyncNestedItemList() {
  const storeName = useStoreName();
  const store = useNestedItemStore(storeName);

  const rootState = store((state) => state);
  const descendants = store((state) => state.descendants);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const synchronizationInterval = useSettingsStore((state) => state.synchronizationInterval);

  const syncItems = useCallback(async () => {
    // Send the entire item list
    const clientList = { ...rootState, descendants } as NestedItemState<
      NestedItemDescendantClientStateType,
      NestedItemDescendantClientStateType
    >;
    const clientModified = clientList.lastModified;
    const updatedItemList = await handleNestedItemListFromClient(clientList);

    if (updatedItemList) {
      updateStoreWithServerData(updatedItemList);
      const serverModified = updatedItemList.lastModified;

      if (serverModified > clientModified) {
        toast({
          title: `Synchronized`,
          description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
            clientList.descendants.length
          }\nServer: ${dateToISOLocal(new Date(updatedItemList.lastModified))}: ${updatedItemList.descendants.length}`,
        });
      }
    }
  }, [descendants, rootState, updateStoreWithServerData]);

  useEffect(() => {
    if (synchronizationInterval > 0) {
      const intervalId = setInterval(syncItems, synchronizationInterval * 1000);
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [syncItems, synchronizationInterval]);
}
