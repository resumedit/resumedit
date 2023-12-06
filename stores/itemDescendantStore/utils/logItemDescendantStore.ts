import { ItemClientStateType, ItemServerToClientType } from "@/types/item";
import { ItemDescendantServerStateType, ItemDescendantStoreState } from "../createItemDescendantStore";

export function logUpdateStoreWithServerData(
  storeState: ItemDescendantStoreState<ItemClientStateType, ItemClientStateType>,
  serverState: ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType>,
) {
  const { descendants: storeDescendants, ...storeItem } = storeState;
  const { descendants: serverDescendants, ...serverItem } = serverState;

  console.log(
    "updateStoreWithServerData:logUpdateStoreWithServerData\n",
    "store.item:\n",
    storeItem,
    "\n\nstore.descendants:\n",
    storeDescendants,
    "\n\nserverState.item:\n",
    serverItem,
    "\n\nserverState.descendants:\n",
    serverDescendants,
  );

  /*
  const toString = (o: object) => {
    return JSON.stringify(o, undefined, 2);
  };
  console.log(
    "updateStoreWithServerData:logUpdateStoreWithServerData\n",
    "store.item:",
    toString(storeItem),
    "\n\nserverState.descendants:\n",
    `${storeDescendants.map((item, index) => {
      return "\n" + `${index}: ${toString(item)}`;
    })}`,
    "\n\nserverState.item:\n",
    toString(serverItem),
    "\n\nserverState.descendants:\n",
    `${serverDescendants.map((item, index) => {
      return "\n" + `${index}: ${toString(item)}`;
    })}`,
  );
  */
}
