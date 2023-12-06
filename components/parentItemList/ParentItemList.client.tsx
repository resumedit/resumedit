// @/components/item/ParentItemList.client.tsx

"use client";

import { ParentItemListStoreProvider, useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { ItemServerStateType } from "@/types/item";
import { ParentItemListType } from "@/types/parentItemList";
import { ResumeActionType } from "@/types/resume";
import { useEffect } from "react";
import ParentItemList from "./ParentItemList";
import { ParentItemListServerComponentProps } from "./ParentItemList.server";
import ParentItemListStoreState from "./ParentItemListStoreState";
import ParentItemListSynchronization from "./ParentItemListSynchronization";

export interface ParentItemListClientContextProps extends ParentItemListClientComponentProps {}

const ParentItemListClientContext = (props: ParentItemListClientContextProps) => {
  const globalStoreName = useStoreName();
  const storeName = props.storeName || globalStoreName;

  const store = useParentItemListStore(storeName);
  const parent = store((state) => state.parent);
  const parentModel = store((state) => state.parentModel);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const settingsStore = useSettingsStore();
  const { showParentItemIdentifiers, showParentItemListInternals, showParentItemListSynchronization } = settingsStore;
  const showIdentifiers = process.env.NODE_ENV === "development" && showParentItemIdentifiers;
  const showListItemInternals = process.env.NODE_ENV === "development" && showParentItemListInternals;
  const showSynchronization = process.env.NODE_ENV === "development" && showParentItemListSynchronization;

  const { serverState } = props;

  useEffect(() => {
    if (updateStoreWithServerData) {
      // console.log(`ParentItemListClientContext: useEffect with serverState:`, serverState);
      updateStoreWithServerData(serverState);
    }
  }, [serverState, updateStoreWithServerData]);

  return (
    <>
      {showIdentifiers ? (
        <h2 className="text-xl mb-2">
          <span className="capitalize">{storeName}s</span> of {parentModel} <code>{JSON.stringify(parent)}</code>
        </h2>
      ) : null}
      <div className="space-y-1">
        {props.resumeAction === "edit" && showSynchronization ? <ParentItemListSynchronization /> : null}
        <ParentItemList />
        {showListItemInternals ? <ParentItemListStoreState storeName={storeName} serverState={serverState} /> : null}
      </div>
    </>
  );
};

export interface ParentItemListClientComponentProps extends ParentItemListServerComponentProps {
  resumeAction?: ResumeActionType;
  serverState: ParentItemListType<ItemServerStateType, ItemServerStateType>;
}

const ParentItemListClientComponent = (props: ParentItemListClientComponentProps) => {
  const storeVersion = 2;
  const resumeAction = props?.resumeAction ? props.resumeAction : "view";
  return (
    <ResumeActionProvider resumeAction={resumeAction}>
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
    </ResumeActionProvider>
  );
};

export default ParentItemListClientComponent;
