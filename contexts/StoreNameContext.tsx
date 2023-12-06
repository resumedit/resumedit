// StoreNameContext.tsx

"use client";

import { ParentItemListStoreNameType } from "@/types/parentItemList";
import { FC, ReactNode, createContext, useContext } from "react";

interface StoreNameContextProps {
  children: ReactNode;
  storeName: string;
}

const StoreNameContext = createContext<string | null>(null);

export const StoreNameProvider: FC<StoreNameContextProps> = ({ children, storeName }) => {
  return <StoreNameContext.Provider value={storeName}>{children}</StoreNameContext.Provider>;
};

export const useStoreName = () => {
  const context = useContext(StoreNameContext);
  if (context === null) {
    throw new Error("useStoreName must be used within a StoreNameProvider");
  }
  return context as ParentItemListStoreNameType;
};
