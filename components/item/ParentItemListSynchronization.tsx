// @/components/item/ParentItemListSynchronization.tsx

"use client";

import { getListLastModifiedById, handleParentItemListFromClient } from "@/actions/parentItemList";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { ItemClientToServerType } from "@/types/item";
import { ParentItemListType } from "@/types/parentItemList";
import { useRef } from "react";
import { toast } from "../ui/use-toast";
import { useSendParentItemLisToServer } from "@/hooks/useSendParentItemListToServer";

const ParentItemListSynchronization = () => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);

  const syncIntervalInputRef = useRef<HTMLSelectElement>(null);
  const synchronizeButtonRef = useRef<HTMLButtonElement>(null);

  const parentId = store((state) => state.parentId);
  const itemModel = store((state) => state.itemModel);
  const lastModified = store((state) => state.lastModified);
  const items = store((state) => state.items);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  async function sendParentItemListToServer(e: React.SyntheticEvent) {
    e.preventDefault();

    const clientList = { parentId, lastModified, items } as ParentItemListType<ItemClientToServerType>;
    if (clientList.parentId) {
      const clientModified = clientList.lastModified;
      const updatedItemList = await handleParentItemListFromClient(itemModel, clientList);

      if (updatedItemList) {
        updateStoreWithServerData(updatedItemList);
        const serverModified = await getListLastModifiedById(itemModel, clientList.parentId);

        if (serverModified > clientModified) {
          toast({
            title: `Synchronized`,
            description: `Local: ${dateToISOLocal(new Date(clientModified))}: ${
              clientList.items.length
            }\nServer: ${dateToISOLocal(new Date(updatedItemList.lastModified))}: ${updatedItemList.items.length}`,
          });
        }
      }
    }
  }

  //const sendToServer =
  useSendParentItemLisToServer();

  const synchronizationInterval = store((state) => state.synchronizationInterval);
  const setSynchronizationInterval = store((state) => state.setSynchronizationInterval);

  async function setSyncInterval(value: string) {
    const interval = Number(value);

    if (typeof interval === "number") {
      setSynchronizationInterval(interval);
      if (interval > 0) {
        if (syncIntervalInputRef.current) {
          syncIntervalInputRef.current.className = "text-bold";
          syncIntervalInputRef.current.value = displayInterval(interval);
        }
      }
    }
  }

  function displayInterval(interval: number): string {
    if (interval <= 0) {
      return "Sync off";
    }
    if (interval % 60 == 0) {
      return `${interval / 60}min`;
    } else {
      return `${interval}s`;
    }
  }

  return !store ? null : (
    <div>
      <form
        className="px-4 py-2 mt-8 bg-elem-light dark:bg-elem-dark-1 flex items-center gap-x-3 rounded-md"
        name="setSyncIntervalForm"
      >
        <Select onValueChange={setSyncInterval}>
          <SelectTrigger className="w-32">
            <SelectValue ref={syncIntervalInputRef} placeholder={displayInterval(synchronizationInterval)} />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 10, 30, 60].map((interval, index) => (
              <SelectItem key={index} value={String(interval)}>
                {displayInterval(interval)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={sendParentItemListToServer} ref={synchronizeButtonRef}>
          Sync now
        </Button>
      </form>
    </div>
  );
};

export default ParentItemListSynchronization;
