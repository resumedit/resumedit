// @/contexts/ParentItemListStoreProvider

import { StoreConfigType, createParentItemListStore } from "@/stores/parentItemList/createParentItemListStore";
import { ItemClientStateType } from "@/types/item";
import { ParentItemListStore, ParentItemModelAccessor } from "@/types/parentItemList";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface ParentItemListStoreProviderProps {
  children: ReactNode;
  configs: StoreConfigType[];
}

type ParentItemListStoreType = ParentItemListStore<ItemClientStateType, ItemClientStateType>;
type ParentItemListSelectorType<T> = (state: ParentItemListStoreType) => T;
type ParentItemListHookType = <T>(selector?: ParentItemListSelectorType<T>) => T;

type RecordType = Record<keyof ParentItemModelAccessor, ParentItemListHookType>;

const ParentItemListStoreContext = createContext<RecordType>({} as RecordType);

export function ParentItemListStoreProvider({ children, configs }: ParentItemListStoreProviderProps) {
  const [stores, setStores] = useState<RecordType>({} as RecordType);
  // Track initialization of stores
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      // Inside useEffect of the ParentItemListStoreProvider
      const initializedStores = configs.reduce(
        (acc, config) => {
          acc[config.itemModel] = createParentItemListStore<ItemClientStateType, ItemClientStateType>(config);
          return acc;
        },
        {} as Record<keyof ParentItemModelAccessor, ParentItemListHookType>,
      );

      setStores(initializedStores);
      setIsInitialized(true);
    }
  }, [configs, isInitialized]);

  return !isInitialized ? null : (
    <ParentItemListStoreContext.Provider value={stores}>{children}</ParentItemListStoreContext.Provider>
  );
}

// Custom hook to use the context
export const useParentItemListStore = (model: keyof ParentItemModelAccessor) => {
  const context = useContext(ParentItemListStoreContext);
  if (!context) {
    throw new Error("useParentItemListStore must be used within a ParentItemListStoreProvider");
  }

  const storeHook = context[model];
  if (!storeHook) {
    throw new Error(`Store for model ${model} is not available`);
  }

  return storeHook; // This should be a Zustand store hook
};
