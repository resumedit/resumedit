// @/components/nestedItemRecursive/NestedItemRecursive.client.tsx

"use client";

import { NestedItemStoreProvider, useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { getItemId } from "@/schemas/id";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import {
  NestedItemListType,
  NestedItemServerStateType,
  NestedItemStoreNameType,
  getParentModel,
} from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import { ReactNode, useEffect } from "react";
import { NestedItemRecursiveServerComponentProps } from "./NestedItemRecursive.server";
import NestedItemRecursiveList from "./NestedItemRecursiveList";
import NestedItemRecursiveListStoreState from "./NestedItemRecursiveListStoreState";
import { NestedItemRecursiveListSynchronization } from "./NestedItemRecursiveListSynchronization";

export interface NestedItemRecursiveProps extends NestedItemRecursiveClientContextProps {}

function NestedItemRecursive(props: NestedItemRecursiveProps): ReactNode {
  const level: NestedItemStoreNameType = props.serverState.itemModel;
  const settingsStore = useSettingsStore();
  const { showNestedItemIdentifiers, showNestedItemInternals, showNestedItemSynchronization } = settingsStore;
  const showIdentifiers = process.env.NODE_ENV === "development" && showNestedItemIdentifiers;
  const showListItemInternals = process.env.NODE_ENV === "development" && showNestedItemInternals;
  const showSynchronization = process.env.NODE_ENV === "development" && showNestedItemSynchronization;
  const parentModel = getParentModel(level);

  const renderItemBasedOnLevel = ({ serverState, resumeAction }: NestedItemRecursiveProps): ReactNode => {
    const level: NestedItemStoreNameType = serverState.itemModel;
    return (
      <>
        {showIdentifiers ? (
          <h2 className="text-xl mb-2">
            <span className="capitalize">{level}s</span> of {parentModel} <code>{JSON.stringify(parent)}</code>
          </h2>
        ) : null}
        <div className="space-y-1">
          {resumeAction === "edit" && showSynchronization ? <NestedItemRecursiveListSynchronization /> : null}
          <NestedItemRecursiveList {...props} />
          {showListItemInternals ? (
            <NestedItemRecursiveListStoreState storeName={level} serverState={serverState} />
          ) : null}
        </div>
      </>
    );
  };

  return (
    <div>
      {renderItemBasedOnLevel({ ...props })}
      {props.serverState.descendants?.map((descendant) => (
        <NestedItemRecursive key={descendant.id} {...{ ...props, serverState: descendant }} />
      ))}
    </div>
  );
}

interface NestedItemRecursiveClientContextProps {
  serverState: NestedItemListType<NestedItemServerStateType, NestedItemServerStateType>;
  resumeAction: ResumeActionType;
}

function NestedItemRecursiveClientContext(props: NestedItemRecursiveClientContextProps) {
  const globalStoreName = useStoreName();

  const store = useNestedItemStore(globalStoreName);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const { serverState } = props;

  useEffect(() => {
    if (updateStoreWithServerData) {
      console.log(`NestedItemRecursiveClientContext: useEffect with serverState:`, serverState);
      updateStoreWithServerData(serverState);
    }
  }, [serverState, updateStoreWithServerData]);

  return (
    <div className="space-y-1">
      <NestedItemRecursive {...props} />
    </div>
  );
}

export interface NestedItemRecursiveClientComponentProps
  extends Omit<NestedItemRecursiveServerComponentProps, "parentId" | "storeName"> {
  resumeAction?: ResumeActionType;
  serverState: NestedItemListType<NestedItemServerStateType, NestedItemServerStateType>;
}

const NestedItemRecursiveClientComponent = (props: NestedItemRecursiveClientComponentProps) => {
  const storeVersion = 2;
  const resumeAction = props?.resumeAction ? props.resumeAction : "view";
  const parentId = props.serverState.parentId;
  const itemModel = props.serverState.itemModel;
  const id = props.serverState.id;
  const clientId = getItemId();
  return !parentId ? null : !id ? (
    <span>
      Please create a resume owned by user with <code>userId=parentId=&quot;{parentId}&quot;</code> first.
    </span>
  ) : (
    <ResumeActionProvider resumeAction={resumeAction}>
      <StoreNameProvider storeName={`${props.serverState.itemModel}`}>
        <NestedItemStoreProvider configs={[{ itemModel: itemModel, parentId, clientId, id, storeVersion }]}>
          <NestedItemRecursiveClientContext {...{ ...props, resumeAction: resumeAction }} />
        </NestedItemStoreProvider>
      </StoreNameProvider>
    </ResumeActionProvider>
  );
};

export default NestedItemRecursiveClientComponent;
