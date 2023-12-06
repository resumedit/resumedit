// @/contexts/ItemDescendantStoreProvider.tsx
import useLogging from "@/hooks/useLogging";
import {
  ItemDescendantStoreConfigType,
  createItemDescendantStore,
} from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

// Define the type for the context value
type ItemDescendantStores = Record<ItemDescendantModelNameType, ReturnType<typeof createItemDescendantStore>>;

// Create context
const ItemDescendantStoreContext = createContext<ItemDescendantStores | null>(null);

interface ItemDescendantStoreProviderProps {
  children: ReactNode;
  configs: ItemDescendantStoreConfigType[];
}

export function ItemDescendantStoreProvider({ children, configs }: ItemDescendantStoreProviderProps) {
  const [stores, setStores] = useState<ItemDescendantStores | null>(null);
  // Track initialization of stores
  const [isInitialized, setIsInitialized] = useState(false);

  // Subscribe to Zustand store `AppSettings` and update global variable
  // to determine if logging to console is enabled
  useLogging();

  useEffect(() => {
    if (!isInitialized) {
      const initializedStores = configs.reduce((acc, config) => {
        acc[config.itemModel] = createItemDescendantStore(config);
        return acc;
      }, {} as ItemDescendantStores);

      setStores(initializedStores);
      setIsInitialized(true);
    }
  }, [configs, isInitialized]);

  return !isInitialized ? null : (
    <ItemDescendantStoreContext.Provider value={stores}>{children}</ItemDescendantStoreContext.Provider>
  );
}

// Custom hook to use the context
export const useItemDescendantStore = (model: ItemDescendantModelNameType) => {
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
