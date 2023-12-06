// @/components/itemDescendant/ItemDescendantListSynchronization.tsx

"use client";

import { Button } from "@/components/ui/button";
import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { useRef } from "react";

import { useSyncItemDescendantStore } from "@/hooks/useSyncItemDescendantStore";
import { syncItemDescendantStoreWithServer } from "@/stores/itemDescendantStore/utils/syncItemDescendantStore";

export function ItemDescendantListSynchronization() {
  const synchronizeButtonRef = useRef<HTMLButtonElement>(null);

  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  useSyncItemDescendantStore();

  async function handleSynchronization(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!rootState) {
      throw Error(`sendItemDescendantToServer(): storeName=${storeName}, rootState=${rootState})`);
    }

    await syncItemDescendantStoreWithServer(rootState, updateStoreWithServerData);
  }

  return !store ? null : (
    <div>
      <form
        className="py-2 mt-8 bg-elem-light dark:bg-elem-dark-1 flex items-center gap-x-3 rounded-md"
        name="setSyncIntervalForm"
      >
        <Button onClick={handleSynchronization} ref={synchronizeButtonRef}>
          Sync now
        </Button>
      </form>
    </div>
  );
}
