// @/components/nestedItem/NestedItemList.client.tsx

"use client";

import { NestedItemStoreProvider, useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { getItemId } from "@/schemas/id";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { NestedItemServerStateType } from "@/types/nestedItem";
import { NestedItemListType } from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import { useEffect } from "react";
import NestedItemList from "./NestedItemList";
import { NestedItemServerComponentProps } from "./NestedItemList.server";
import NestedItemStoreState from "./NestedItemListStoreState";
import NestedItemSynchronization from "./NestedItemListSynchronization";

export interface NestedItemClientContextProps extends NestedItemClientComponentProps {}

const NestedItemClientContext = (props: NestedItemClientContextProps) => {
  const globalStoreName = useStoreName();
  const storeName = props.storeName || globalStoreName;

  const store = useNestedItemStore(storeName);
  const parentModel = store((state) => state.parentModel);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const settingsStore = useSettingsStore();
  const { showNestedItemIdentifiers, showNestedItemInternals, showNestedItemSynchronization } = settingsStore;
  const showIdentifiers = process.env.NODE_ENV === "development" && showNestedItemIdentifiers;
  const showListItemInternals = process.env.NODE_ENV === "development" && showNestedItemInternals;
  const showSynchronization = process.env.NODE_ENV === "development" && showNestedItemSynchronization;

  const { serverState } = props;

  useEffect(() => {
    if (updateStoreWithServerData) {
      // console.log(`NestedItemClientContext: useEffect with serverState:`, serverState);
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
        {props.resumeAction === "edit" && showSynchronization ? <NestedItemSynchronization /> : null}
        <NestedItemList />
        {showListItemInternals ? <NestedItemStoreState storeName={storeName} serverState={serverState} /> : null}
      </div>
    </>
  );
};

export interface NestedItemClientComponentProps extends Omit<NestedItemServerComponentProps, "parentId"> {
  resumeAction?: ResumeActionType;
  serverState: NestedItemListType<NestedItemServerStateType, NestedItemServerStateType>;
}

const NestedItemClientComponent = (props: NestedItemClientComponentProps) => {
  const storeVersion = 2;
  const resumeAction = props?.resumeAction ? props.resumeAction : "view";
  const parentId = props.serverState.parentId;
  const id = props.serverState.id;
  const clientId = getItemId();
  return !parentId ? null : !id ? (
    <span>Please create a resume first</span>
  ) : (
    <ResumeActionProvider resumeAction={resumeAction}>
      <StoreNameProvider storeName={props.storeName}>
        <NestedItemStoreProvider configs={[{ itemModel: "resume", parentId, clientId, id, storeVersion }]}>
          <NestedItemClientContext {...props} />
        </NestedItemStoreProvider>
      </StoreNameProvider>
    </ResumeActionProvider>
  );
};

export default NestedItemClientComponent;
