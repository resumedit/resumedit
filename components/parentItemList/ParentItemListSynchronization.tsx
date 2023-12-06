// @/components/item/ParentItemListSynchronization.tsx

"use client";

import { handleParentItemListFromClient } from "@/actions/syncParentItemList";
import { Button } from "@/components/ui/button";
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { useSyncParentItemList } from "@/hooks/useSyncParentItemList";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { ItemClientStateType } from "@/types/item";
import { ParentItemListType } from "@/types/parentItemList";
import { useRef } from "react";
import { toast } from "../ui/use-toast";

const ParentItemListSynchronization = () => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);

  const synchronizeButtonRef = useRef<HTMLButtonElement>(null);

  const parent = store((state) => state.parent);
  const itemModel = store((state) => state.itemModel);
  const items = store((state) => state.items);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  async function sendParentItemListToServer(e: React.SyntheticEvent) {
    e.preventDefault();

    const clientList = { parent, items } as ParentItemListType<ItemClientStateType, ItemClientStateType>;

    if (!parent || !items) {
      throw Error(
        `sendParentItemListToServer(): storeName=${storeName} itemModel=${itemModel}, parent=${parent}, items=${items})`,
      );
    }

    const clientModified = parent.lastModified;
    const updatedItemList = await handleParentItemListFromClient(itemModel, clientList);

    if (updatedItemList) {
      updateStoreWithServerData(updatedItemList);
      const serverModified = updatedItemList.parent.lastModified;

      if (serverModified > clientModified) {
        toast({
          title: `Synchronized`,
          description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
            clientList.items.length
          }\nServer: ${dateToISOLocal(serverModified)}: ${updatedItemList.items.length}`,
        });
      }
    }
  }

  useSyncParentItemList();

  return !store ? null : (
    <div>
      <form
        className="px-4 py-2 mt-8 bg-elem-light dark:bg-elem-dark-1 flex items-center gap-x-3 rounded-md"
        name="setSyncIntervalForm"
      >
        <Button onClick={sendParentItemListToServer} ref={synchronizeButtonRef}>
          Sync now
        </Button>
      </form>
    </div>
  );
};

export default ParentItemListSynchronization;
