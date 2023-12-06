// @/components/nestedItem/NestedItemListSynchronization.tsx

"use client";

import { handleNestedItemListFromClient } from "@/actions/syncNestedItemList";
import { Button } from "@/components/ui/button";
import { useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { NestedItemState } from "@/stores/nestedItemStore/createNestedItemStore";
import { NestedItemClientStateType } from "@/types/nestedItem";
import { useRef } from "react";
import { toast } from "../ui/use-toast";
import { useSyncNestedItemList } from "@/hooks/useSyncNestedItemList";

const NestedItemSynchronization = () => {
  const storeName = useStoreName();
  const store = useNestedItemStore(storeName);

  const synchronizeButtonRef = useRef<HTMLButtonElement>(null);

  const rootState = store((state) => state);
  const itemModel = store((state) => state.itemModel);
  const descendants = store((state) => state.descendants);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  async function sendNestedItemToServer(e: React.SyntheticEvent) {
    e.preventDefault();

    const clientList = { ...rootState, descendants } as NestedItemState<
      NestedItemClientStateType,
      NestedItemClientStateType
    >;

    if (!rootState || !descendants) {
      throw Error(
        `sendNestedItemToServer(): storeName=${storeName} itemModel=${itemModel}, rootState=${rootState}, descendants=${descendants})`,
      );
    }

    const clientModified = rootState.lastModified;
    const updatedItemList = await handleNestedItemListFromClient(clientList);

    if (updatedItemList) {
      updateStoreWithServerData(updatedItemList);
      const serverModified = updatedItemList.lastModified;

      if (serverModified > clientModified) {
        toast({
          title: `Synchronized`,
          description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
            clientList.descendants.length
          }\nServer: ${dateToISOLocal(serverModified)}: ${updatedItemList.descendants.length}`,
        });
      }
    }
  }

  useSyncNestedItemList();

  return !store ? null : (
    <div>
      <form
        className="px-4 py-2 mt-8 bg-elem-light dark:bg-elem-dark-1 flex items-center gap-x-3 rounded-md"
        name="setSyncIntervalForm"
      >
        <Button onClick={sendNestedItemToServer} ref={synchronizeButtonRef}>
          Sync now
        </Button>
      </form>
    </div>
  );
};

export default NestedItemSynchronization;
