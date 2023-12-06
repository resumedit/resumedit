// @/stores/parentItemList/util/syncParentItemListWithServer.ts
import { mergeClientListWithServer } from "@/actions/parentItemList";
import { toast } from "@/components/ui/use-toast";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { getItemId } from "@/schemas/id";
import {
  ItemClientStateType,
  ItemClientToServerType,
  ItemDisposition,
  ItemOutputType,
  ItemServerToClientType,
} from "@/types/item";
import { ParentItemListStoreNameType, ParentItemListType, ParentItemModelAccessor } from "@/types/parentItemList";
import { ModificationTimestampType } from "@/types/timestamp";

export const processUpdateFromServer = <T extends ItemClientStateType, U extends ItemOutputType>(
  clientState: ParentItemListType<T>,
  serverState: ParentItemListType<U>,
): ParentItemListType<T> | null => {
  const syncMsg = `lastModified=${clientState.lastModified} items=${clientState.items.length}  server: lastModified=${serverState.lastModified} items=${serverState.items.length}`;
  if (serverState.lastModified <= clientState.lastModified) {
    // console.log(`processUpdateFromServer: server state is not more recent ${syncMsg}`);
    return null;
  }
  console.log(`processUpdateFromServer: server is more recent ${syncMsg}`);

  // Merge strategy:
  // Everything is based on the `id`, which is generated on the server and
  // stored in items on the client once they have been synced to the server.
  // If an item from the server exists also on the client based on its `id`, then
  // server data overwrites client data.
  // Otherwise, the server's item is extended with a new `clientId` and
  // then added to the client store
  const items = serverState.items.map((serverItem): T => {
    const clientItem = clientState.items.find((a) => a.id === serverItem.id);
    // Ensure that all items in the Zustand store have the required client properties
    // but overwrite them with the localItem if that one has them already
    const clientProperties = {
      disposition: ItemDisposition.Synced,
    };
    // FIXME: We should make the relationship between ItemClientStateType
    // and ItemOutputType explicit
    const clientItemFromServerItem = { clientId: getItemId(), ...serverItem } as unknown as T;
    return clientItem
      ? { ...clientItem, ...clientProperties, ...serverItem }
      : { ...clientProperties, ...clientItemFromServerItem };
  });
  const updatedState = {
    parentId: serverState.parentId,
    items: items,
    lastModified: serverState.lastModified,
    serverModified: serverState.lastModified,
  };

  console.log(`processUpdateFromServer: got serverState:`, serverState);
  console.log(`processUpdateFromServer: returning updatedState:`, updatedState);

  return updatedState;
};

export const syncParentItemListWithServer = async <T extends ItemClientToServerType, U extends ItemServerToClientType>(
  clientList: ParentItemListType<T>,
  updateStoreWithServerData: (serverState: ParentItemListType<U>) => void,
  getListLastModifiedById: (parentId: string) => Promise<ModificationTimestampType>,
  getList: (parentId: string) => Promise<ParentItemListType<U>>,
  model: keyof ParentItemModelAccessor,
  parentModel: keyof ParentItemModelAccessor,
) => {
  // Sync the entire item list atomically
  if (clientList.parentId) {
    const clientModified = clientList.lastModified;
    const updatedItemList = await mergeClientListWithServer<T, U>(
      clientList,
      getListLastModifiedById,
      getList,
      model as ParentItemListStoreNameType,
      parentModel as ParentItemListStoreNameType,
    );

    if (updatedItemList) {
      updateStoreWithServerData(updatedItemList);
      const serverModified = await getListLastModifiedById(clientList.parentId);

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
};
