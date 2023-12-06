// @/contexts/SingleParentItemListStoreProvider.tsx

"use client";

import { StoreConfigType, createParentItemListStore } from "@/stores/parentItemList/createParentItemListStore";
import { ParentItemListStore, ParentItemModelAccessor } from "@/types/parentItemList";
import { ItemClientStateType } from "@/types/item";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

// Context definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SingleParentItemListStoreContextProps<T extends ItemClientStateType> {
  children: ReactNode;
  config: StoreConfigType;
}
const SingleParentItemListStoreContext = createContext<
  Record<string, ParentItemListStore<ItemClientStateType> | undefined>
>({});

export const ParentItemListStoreProvider = <T extends ItemClientStateType>({
  children,
  config,
}: SingleParentItemListStoreContextProps<T>) => {
  const store = createParentItemListStore<ItemClientStateType>(config);

  const [isStoreReady, setIsStoreReady] = useState(false);

  useEffect(() => {
    if (!isStoreReady) {
      setIsStoreReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return !isStoreReady ? null : (
    <SingleParentItemListStoreContext.Provider
      value={
        { [config.itemModel]: store } as unknown as Record<string, ParentItemListStore<ItemClientStateType> | undefined>
      }
    >
      {children}
    </SingleParentItemListStoreContext.Provider>
  );
};

export const useSingleParentItemListStore = <T extends ItemClientStateType>(
  model: keyof ParentItemModelAccessor,
): ParentItemListStore<T> => {
  const context = useContext(SingleParentItemListStoreContext);
  if (!context) {
    throw new Error("useSingleParentItemListStore must be used within a ParentItemListStoreProvider");
  }

  const store = context[model];
  if (!store) {
    throw new Error(`Store for model ${model} is not available`);
  }

  return store as ParentItemListStore<T>;
};
