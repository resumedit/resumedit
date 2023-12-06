// @/stores/parentItemList/util/syncParentItemListWithServer.ts
import { getItemId } from "@/schemas/id";
import { ItemClientStateType, ItemDisposition, ItemOutputType } from "@/types/item";
import { ParentItemListType } from "@/types/parentItemList";

export function handleParentItemListFromServer<T extends ItemClientStateType, U extends ItemOutputType>(
  clientState: ParentItemListType<T>,
  serverState: ParentItemListType<U>,
): ParentItemListType<T> | null {
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
}
