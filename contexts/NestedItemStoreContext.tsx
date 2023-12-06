// @/contexts/NestedItemStoreProvider

import { NestedItemHookType, createNestedItemStore } from "@/stores/nestedItemStore/createNestedItemStore";
import { NestedItemClientStateType, NestedItemModelAccessor } from "@/types/nestedItem";
import { NestedStoreConfigType } from "@/stores/nestedItemStore/createNestedItemStore";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface NestedItemStoreProviderProps {
  children: ReactNode;
  configs: NestedStoreConfigType[];
}

type RecordType = Record<keyof NestedItemModelAccessor, NestedItemHookType>;

const NestedItemStoreContext = createContext<RecordType>({} as RecordType);

export function NestedItemStoreProvider({ children, configs }: NestedItemStoreProviderProps) {
  const [stores, setStores] = useState<RecordType>({} as RecordType);
  // Track initialization of stores
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      // Inside useEffect of the NestedItemStoreProvider
      const initializedStores = configs.reduce(
        (acc, config) => {
          acc[config.itemModel] = createNestedItemStore<NestedItemClientStateType, NestedItemClientStateType>(config);
          return acc;
        },
        {} as Record<keyof NestedItemModelAccessor, NestedItemHookType>,
      );

      setStores(initializedStores);
      setIsInitialized(true);
    }
  }, [configs, isInitialized]);

  return !isInitialized ? null : (
    <NestedItemStoreContext.Provider value={stores}>{children}</NestedItemStoreContext.Provider>
  );
}

// Custom hook to use the context
export const useNestedItemStore = (model: keyof NestedItemModelAccessor) => {
  const context = useContext(NestedItemStoreContext);
  if (!context) {
    throw new Error("useNestedItemStore must be used within a NestedItemStoreProvider");
  }

  const storeHook = context[model];
  if (!storeHook) {
    throw new Error(`Store for model ${model} is not available`);
  }

  return storeHook; // This should be a Zustand store hook
};
