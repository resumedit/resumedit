import { getListLastModifiedById, handleParentItemListFromClient } from "@/actions/parentItemList";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { ItemClientToServerType } from "@/types/item";
import { ParentItemListHookType, ParentItemListType } from "@/types/parentItemList";

export async function sendParentItemLisToServer(store: ParentItemListHookType) {
  const parentId = store((state) => state.parentId);
  const itemModel = store((state) => state.itemModel);
  const lastModified = store((state) => state.lastModified);
  const items = store((state) => state.items);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

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
