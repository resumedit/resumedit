import { ItemServerToClientType } from "@/types/item";
import { NestedItemDescendantClientStateType, NestedItemListType } from "@/types/nestedItem";
import { NestedItemRecursiveStore } from "../createNestedItemRecursiveStore";

export function logUpdateStoreWithServerData(
  storeState: NestedItemRecursiveStore<NestedItemDescendantClientStateType, NestedItemDescendantClientStateType>,
  serverState: NestedItemListType<ItemServerToClientType, ItemServerToClientType>,
) {
  console.log(
    "useNestedItemStore/updateStoreWithServerData:",
    "\nstore.parent:",
    JSON.stringify(storeState),
    "\n\nserverState.parent:\n",
    JSON.stringify(serverState),
    "\n\nserverState.items:\n",
    `${serverState.descendants.map((item, index) => {
      return "\n" + `${index}: ${JSON.stringify(item)}`;
    })}`,
  );
}
