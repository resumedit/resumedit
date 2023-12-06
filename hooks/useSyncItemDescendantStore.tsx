// @/hookw/useSyncItemDescendantStore.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { syncItemDescendantStoreWithServer } from "@/stores/itemDescendantStore/utils/syncItemDescendantStore";
import useAppSettingsStore from "@/stores/appSettings/useAppSettingsStore";
import { useCallback, useEffect } from "react";

export function useSyncItemDescendantStore() {
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);

  const rootState = store((state) => state);
  const updateLastModifiedOfModifiedItems = store((state) => state.updateLastModifiedOfModifiedItems);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const synchronizationInterval = useAppSettingsStore((state) => state.synchronizationInterval);

  const syncItems = useCallback(async () => {
    await syncItemDescendantStoreWithServer(rootState, updateLastModifiedOfModifiedItems, updateStoreWithServerData);
  }, [rootState, updateLastModifiedOfModifiedItems, updateStoreWithServerData]);

  useEffect(() => {
    if (synchronizationInterval > 0) {
      const intervalId = setInterval(syncItems, synchronizationInterval * 1000);
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [syncItems, synchronizationInterval]);
}
