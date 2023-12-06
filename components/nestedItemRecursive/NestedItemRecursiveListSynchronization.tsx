// @/components/nestedItemRecursive/NestedItemRecursiveListSynchronization.tsx

"use client";

import { handleNestedItemRecursiveListFromClient } from "@/actions/syncNestedItemRecursiveList";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useNestedItemRecursiveStore } from "@/contexts/NestedItemRecursiveStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { useSyncNestedItemRecursiveList } from "@/hooks/useSyncNestedItemRecursiveList";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { NestedItemRecursiveState } from "@/stores/nestedItemRecursiveStore/createNestedItemRecursiveStore";
import { NestedItemDescendantClientStateType } from "@/types/nestedItem";
import { useRef } from "react";

export function NestedItemRecursiveListSynchronization() {
  const storeName = useStoreName();
  const store = useNestedItemRecursiveStore(storeName);

  const synchronizeButtonRef = useRef<HTMLButtonElement>(null);

  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  async function sendNestedItemToServer(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!rootState) {
      throw Error(`sendNestedItemToServer(): storeName=${storeName}, rootState=${rootState})`);
    }

    // Destructure only the necessary state properties
    const {
      clientId,
      id,
      parentId,
      createdAt,
      lastModified,
      deletedAt,
      disposition,
      itemModel,
      descendantDraft,
      descendants,
    } = rootState;

    // Reconstruct the client state with only the necessary properties
    const clientState: NestedItemRecursiveState<
      NestedItemDescendantClientStateType,
      NestedItemDescendantClientStateType
    > = {
      clientId,
      id,
      parentId,
      createdAt,
      lastModified,
      deletedAt,
      disposition,
      itemModel,
      descendantDraft,
      descendants,
    };

    const clientModified = rootState.lastModified;
    const updatedItemList = await handleNestedItemRecursiveListFromClient(clientState);

    if (updatedItemList) {
      updateStoreWithServerData(updatedItemList);
      const serverModified = updatedItemList.lastModified;

      if (serverModified > clientModified) {
        toast({
          title: `Synchronized`,
          description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
            clientState.descendants.length
          }\nServer: ${dateToISOLocal(serverModified)}: ${updatedItemList.descendants.length}`,
        });
      }
    }
  }

  useSyncNestedItemRecursiveList();

  return !store ? null : (
    <div>
      <form
        className="py-2 mt-8 bg-elem-light dark:bg-elem-dark-1 flex items-center gap-x-3 rounded-md"
        name="setSyncIntervalForm"
      >
        <Button onClick={sendNestedItemToServer} ref={synchronizeButtonRef}>
          Sync now
        </Button>
      </form>
    </div>
  );
}
