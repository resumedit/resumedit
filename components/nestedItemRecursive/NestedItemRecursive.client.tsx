// @/components/nestedItemRecursive/NestedItemRecursive.client.tsx

"use client";

import {
  NestedItemRecursiveStoreProvider,
  useNestedItemRecursiveStore,
} from "@/contexts/NestedItemRecursiveStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { getItemId } from "@/schemas/id";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import {
  NestedItemListType,
  NestedItemModelNameType,
  NestedItemServerStateType,
  getDescendantModel,
  getParentModel,
} from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import { ReactNode, useEffect } from "react";
import NestedItemRecursiveDescendantList from "./NestedItemRecursiveDescendantList";
import NestedItemRecursiveItem from "./NestedItemRecursiveItem";
import NestedItemRecursiveItemInput from "./NestedItemRecursiveItemInput";
import { NestedItemRecursiveListSynchronization } from "./NestedItemRecursiveListSynchronization";

export interface NestedItemRecursiveRenderProps extends NestedItemRecursiveClientContextProps {}
function NestedItemRecursiveRender(props: NestedItemRecursiveRenderProps): ReactNode {
  const { serverState, rootItemModel, leafItemModel, resumeAction } = props;

  const { id, itemModel, descendants } = serverState;

  const settingsStore = useSettingsStore();
  const { showNestedItemIdentifiers, showNestedItemSynchronization } = settingsStore;
  const showIdentifiers = process.env.NODE_ENV === "development" && showNestedItemIdentifiers;
  const showSynchronization = process.env.NODE_ENV === "development" && showNestedItemSynchronization;
  const parentModel = getParentModel(itemModel);
  const descendantModel = getDescendantModel(itemModel);
  const atRootLevel = itemModel === rootItemModel;
  const itemAtLeafLevel = itemModel === leafItemModel;
  const descendantsAtLeafLevel = descendantModel === leafItemModel;

  const renderItemBasedOnLevel = ({ serverState }: NestedItemRecursiveRenderProps): ReactNode => {
    const level: NestedItemModelNameType = serverState.itemModel;
    return (
      <>
        {showIdentifiers ? (
          <h2 className="text-xl mb-2">
            <span className="capitalize">{level}s</span> of {parentModel} <code>{JSON.stringify(parent)}</code>
          </h2>
        ) : null}
        <div className="space-y-1">
          <NestedItemRecursiveItem {...props} />
          {!descendantsAtLeafLevel ? null : <NestedItemRecursiveDescendantList {...props} />}
        </div>
      </>
    );
  };

  return !descendantModel ? null : (
    <div>
      {atRootLevel && resumeAction === "edit" && showSynchronization ? (
        <NestedItemRecursiveListSynchronization />
      ) : null}
      {renderItemBasedOnLevel({ ...props })}
      {itemAtLeafLevel ? null : (
        <>
          {descendants?.map((descendant) => (
            <NestedItemRecursiveRender key={descendant.id} {...{ ...props, serverState: descendant }} />
          ))}
          <NestedItemRecursiveItemInput
            {...{ ...props, serverState: { ...serverState, parentId: id, itemModel: descendantModel } }}
          />
        </>
      )}
    </div>
  );
}

interface NestedItemRecursiveClientContextProps extends NestedItemRecursiveClientComponentProps {}
function NestedItemRecursiveClientContext(props: NestedItemRecursiveClientContextProps) {
  const globalStoreName = useStoreName();

  const store = useNestedItemRecursiveStore(globalStoreName);
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
      <NestedItemRecursiveRender {...props} />
    </div>
  );
}

export interface NestedItemRecursiveClientComponentProps {
  serverState: NestedItemListType<NestedItemServerStateType, NestedItemServerStateType>;
  rootItemModel: NestedItemModelNameType;
  leafItemModel: NestedItemModelNameType;
  resumeAction: ResumeActionType;
}

const NestedItemRecursiveClientComponent = (props: NestedItemRecursiveClientComponentProps) => {
  const storeVersion = 1;

  const itemModel = props.serverState.itemModel;
  const parentClientId = getItemId();
  const clientId = getItemId();
  const parentId = props.serverState.parentId;
  const id = props.serverState.id;

  return (
    <ResumeActionProvider resumeAction={props.resumeAction}>
      <StoreNameProvider storeName={`${props.serverState.itemModel}`}>
        <NestedItemRecursiveStoreProvider
          configs={[{ itemModel, parentClientId, clientId, parentId, id, storeVersion }]}
        >
          <NestedItemRecursiveClientContext {...props} />
        </NestedItemRecursiveStoreProvider>
      </StoreNameProvider>
    </ResumeActionProvider>
  );
};

export default NestedItemRecursiveClientComponent;
