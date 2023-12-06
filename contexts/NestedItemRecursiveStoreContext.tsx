// @/contexts/NestedItemRecursiveStoreProvider

import {
  NestedItemRecursiveHookType,
  NestedItemRecursiveStoreConfigType,
  createNestedItemRecursiveStore,
} from "@/stores/nestedItemRecursiveStore/createNestedItemRecursiveStore";
import { NestedItemClientStateType, NestedItemModelAccessor } from "@/types/nestedItem";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface NestedItemRecursiveStoreProviderProps {
  children: ReactNode;
  configs: NestedItemRecursiveStoreConfigType[];
}

type RecordType = Record<keyof NestedItemModelAccessor, NestedItemRecursiveHookType>;

const NestedItemRecursiveStoreContext = createContext<RecordType>({} as RecordType);

export function NestedItemRecursiveStoreProvider({ children, configs }: NestedItemRecursiveStoreProviderProps) {
  const [stores, setStores] = useState<RecordType>({} as RecordType);
  // Track initialization of stores
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      // Inside useEffect of the NestedItemRecursiveStoreProvider
      const initializedStores = configs.reduce(
        (acc, config) => {
          acc[config.itemModel] = createNestedItemRecursiveStore<NestedItemClientStateType, NestedItemClientStateType>(
            config,
          );
          return acc;
        },
        {} as Record<keyof NestedItemModelAccessor, NestedItemRecursiveHookType>,
      );

      setStores(initializedStores);
      setIsInitialized(true);
    }
  }, [configs, isInitialized]);

  return !isInitialized ? null : (
    <NestedItemRecursiveStoreContext.Provider value={stores}>{children}</NestedItemRecursiveStoreContext.Provider>
  );
}

// Custom hook to use the context
export const useNestedItemRecursiveStore = (model: keyof NestedItemModelAccessor) => {
  const context = useContext(NestedItemRecursiveStoreContext);
  if (!context) {
    throw new Error("useNestedItemRecursiveStore must be used within a NestedItemRecursiveStoreProvider");
  }

  const storeHook = context[model];
  if (!storeHook) {
    throw new Error(`Store for model ${model} is not available`);
  }

  return storeHook; // This should be a Zustand store hook
};
