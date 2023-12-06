// @/components/item/ParentItemList.client.tsx

"use client";

import { ParentItemListStoreProvider, useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { idDefault } from "@/schemas/id";
import { ParentItemListType, ParentItemModelAccessor } from "@/types/parentItemList";
import { ItemServerStateType } from "@/types/item";
import { useEffect } from "react";
import ParentItemListInput from "./ParentItemInput";
import ParentItemList from "./ParentItemList";
import ParentItemListStoreState from "./ParentItemListStoreState";
import ParentItemListSynchronization from "./ParentItemListSynchronization";

interface Props {
  storeName: keyof ParentItemModelAccessor;
  serverState: ParentItemListType<ItemServerStateType>;
}
const ParentItemListClientContext = ({ serverState }: Props) => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const parentId = store((state) => state.parentId);
  const parentModel = store((state) => state.parentModel);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  useEffect(() => {
    if (updateStoreWithServerData) {
      console.log(`ParentItemListClientContext: useEffect with serverState:`, serverState);
      updateStoreWithServerData(serverState);
    }
  }, [serverState, updateStoreWithServerData]);

  return (
    <>
      <h2 className="text-xl mb-2">
        <span className="capitalize">{storeName}s</span> of {parentModel} <code>{parentId}</code>
      </h2>
      <div className="space-y-1">
        <ParentItemListSynchronization />
        <ParentItemList />
        <ParentItemListInput />
        <ParentItemListStoreState
          storeName={storeName}
          parentId={serverState.parentId || idDefault}
          serverModified={serverState.lastModified}
        />
      </div>
    </>
  );
};

const ParentItemListClientComponent = (props: Props) => {
  const storeVersion = 2;
  return (
    <StoreNameProvider storeName={props.storeName}>
      <ParentItemListStoreProvider
        configs={[
          { itemModel: "resume", storeVersion },
          { itemModel: "organization", storeVersion },
          { itemModel: "role", storeVersion },
          { itemModel: "achievement", storeVersion },
        ]}
      >
        <ParentItemListClientContext {...props} />
      </ParentItemListStoreProvider>
    </StoreNameProvider>
  );
};

export default ParentItemListClientComponent;
