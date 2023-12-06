// @/contexts/ItemDescendantStoreProvider

import {
  ItemDescendantHookType,
  ItemDescendantStoreConfigType,
  createItemDescendantStore,
} from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemClientStateType } from "@/types/item";
import { ItemDescendantModelAccessor } from "@/types/itemDescendant";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface ItemDescendantStoreProviderProps {
  children: ReactNode;
  configs: ItemDescendantStoreConfigType[];
}

type RecordType = Record<keyof ItemDescendantModelAccessor, ItemDescendantHookType>;

const ItemDescendantStoreContext = createContext<RecordType>({} as RecordType);

export function ItemDescendantStoreProvider({ children, configs }: ItemDescendantStoreProviderProps) {
  const [stores, setStores] = useState<RecordType>({} as RecordType);
  // Track initialization of stores
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      // Inside useEffect of the ItemDescendantStoreProvider
      const initializedStores = configs.reduce(
        (acc, config) => {
          acc[config.itemModel] = createItemDescendantStore<ItemClientStateType, ItemClientStateType>(config);
          return acc;
        },
        {} as Record<keyof ItemDescendantModelAccessor, ItemDescendantHookType>,
      );

      setStores(initializedStores);
      setIsInitialized(true);
    }
  }, [configs, isInitialized]);

  return !isInitialized ? null : (
    <ItemDescendantStoreContext.Provider value={stores}>{children}</ItemDescendantStoreContext.Provider>
  );
}

// Custom hook to use the context
export const useItemDescendantStore = (model: keyof ItemDescendantModelAccessor) => {
  const context = useContext(ItemDescendantStoreContext);
  if (!context) {
    throw new Error("useItemDescendantStore must be used within a ItemDescendantStoreProvider");
  }

  const storeHook = context[model];
  if (!storeHook) {
    throw new Error(`Store for model ${model} is not available`);
  }

  return storeHook; // This should be a Zustand store hook
};
