import { ItemClientStateType, ItemServerToClientType } from "@/types/item";
import { ParentItemListType } from "@/types/parentItemList";

export function logUpdateStoreWithServerData(
  storeState: ParentItemListType<ItemClientStateType | null, ItemClientStateType>,
  serverState: ParentItemListType<ItemServerToClientType, ItemServerToClientType>,
) {
  console.log(
    "useParentItemListStore/updateStoreWithServerData:",
    "\nstore.parent:",
    JSON.stringify(storeState.parent),
    "\n\nserverState.parent:\n",
    JSON.stringify(serverState.parent),
    "\n\nserverState.items:\n",
    `${serverState.items.map((item, index) => {
      return "\n" + `${index}: ${JSON.stringify(item)}`;
    })}`,
  );
}
