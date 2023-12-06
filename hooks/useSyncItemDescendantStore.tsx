// @/hookw/useSyncItemDescendantStore.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { useItemDescendantStoreState } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { syncItemDescendantStoreWithServer } from "@/stores/itemDescendantStore/utils/syncItemDescendantStore";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { useCallback, useEffect } from "react";

export function useSyncItemDescendantStore() {
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);

  const rootState = useItemDescendantStoreState(storeName);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const synchronizationInterval = useSettingsStore((state) => state.synchronizationInterval);

  const syncItems = useCallback(async () => {
    await syncItemDescendantStoreWithServer(rootState, updateStoreWithServerData);
  }, [rootState, updateStoreWithServerData]);

  useEffect(() => {
    if (synchronizationInterval > 0) {
      const intervalId = setInterval(syncItems, synchronizationInterval * 1000);
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [syncItems, synchronizationInterval]);
}
