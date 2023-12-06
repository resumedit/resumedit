// @/components/nestedItemRecursive/NestedItemRecursive.client.tsx

"use client";

import {
  NestedItemRecursiveStoreProvider,
  useNestedItemRecursiveStore,
} from "@/contexts/NestedItemRecursiveStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { IdSchemaType, getItemId } from "@/schemas/id";
import { NestedItemRecursiveState } from "@/stores/nestedItemRecursiveStore/createNestedItemRecursiveStore";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import {
  NestedItemDescendantClientStateType,
  NestedItemDescendantDataType,
  NestedItemDescendantDataUntypedType,
  NestedItemListType,
  NestedItemModelNameType,
  NestedItemServerStateType,
  getDescendantModel,
} from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import NestedItemRecursiveListItem from "./NestedItemRecursiveListItem";
import NestedItemRecursiveListItemInput from "./NestedItemRecursiveListItemInput";
import { NestedItemRecursiveListSynchronization } from "./NestedItemRecursiveListSynchronization";

export interface NestedItemRecursiveRenderProps {
  item: NestedItemRecursiveState<NestedItemDescendantClientStateType, NestedItemDescendantClientStateType>;
  rootItemModel: NestedItemModelNameType;
  leafItemModel: NestedItemModelNameType;
  resumeAction: ResumeActionType;
  editingInput: boolean;
  setEditingInput: Dispatch<SetStateAction<boolean>>;
  setItemData: (data: NestedItemDescendantDataUntypedType, clientId: string) => void;
  markItemAsDeleted: (clientId: IdSchemaType) => void;
  itemDraft: NestedItemDescendantDataType<NestedItemDescendantClientStateType>;
  updateItemDraft: (itemData: NestedItemDescendantDataUntypedType) => void;
  commitItemDraft: () => void;
  showIdentifiers: boolean;
  showSynchronization: boolean;
}
function NestedItemRecursiveRender(props: NestedItemRecursiveRenderProps): ReactNode {
  const {
    item,
    rootItemModel,
    leafItemModel,
    resumeAction,
    editingInput,
    setEditingInput,
    setItemData,
    markItemAsDeleted,
    itemDraft,
    updateItemDraft,
    commitItemDraft,
    showIdentifiers,
    showSynchronization,
  } = props;

  const { itemModel, descendants } = item;
  const canEdit = itemModel === "user" ? false : resumeAction === "edit";

  const descendantModel = getDescendantModel(itemModel);
  const atRootLevel = itemModel === rootItemModel;
  const itemAtLeafLevel = itemModel === leafItemModel;
  // const descendantsAtLeafLevel = descendantModel === leafItemModel;

  const renderItemBasedOnLevel = ({ item }: NestedItemRecursiveRenderProps): ReactNode => {
    const itemModel: NestedItemModelNameType = item.itemModel;
    return (
      <>
        {showIdentifiers ? (
          <h2 className="text-xl mb-2">
            <span className="capitalize">{itemModel}s</span> of {itemModel} <code>{JSON.stringify(item)}</code>
          </h2>
        ) : null}
        <div className="space-y-1">
          {/* <NestedItemRecursiveItem {...props} /> */}
          <NestedItemRecursiveListItem
            index={0}
            itemModel={itemModel}
            item={item}
            setItemData={setItemData}
            markItemAsDeleted={markItemAsDeleted}
            itemIsDragable={false}
            canEdit={canEdit}
          />
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
            <NestedItemRecursiveRender
              key={descendant.id}
              {...{ ...props, item: descendant, itemModel: descendantModel }}
            />
          ))}
          <NestedItemRecursiveListItemInput
            itemModel={descendantModel}
            itemDraft={itemDraft}
            updateItemDraft={updateItemDraft}
            commitItemDraft={commitItemDraft}
            editingInput={editingInput}
            setEditingInput={setEditingInput}
            canEdit={canEdit}
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
  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);
  const [editingInput, setEditingInput] = useState(props.resumeAction === "edit");
  const setItemData = store((state) => state.setItemData);
  const markItemAsDeleted = store((state) => state.markItemAsDeleted);

  const itemDraft = store((state) => state.descendantDraft);
  const updateItemDraft = store((state) => state.updateDescendantDraft);
  const commitItemDraft = store((state) => state.commitDescendantDraft);

  const settingsStore = useSettingsStore();
  const { showNestedItemIdentifiers, showNestedItemSynchronization } = settingsStore;
  const showIdentifiers = process.env.NODE_ENV === "development" && showNestedItemIdentifiers;
  const showSynchronization = process.env.NODE_ENV === "development" && showNestedItemSynchronization;

  const { serverState } = props;

  useEffect(() => {
    if (updateStoreWithServerData) {
      console.log(`NestedItemRecursiveClientContext: useEffect with serverState:`, serverState);
      updateStoreWithServerData(serverState);
    }
  }, [serverState, updateStoreWithServerData]);

  const clientProps = {
    ...props,
    item: rootState,
    editingInput,
    setEditingInput,
    setItemData,
    markItemAsDeleted,
    itemDraft,
    updateItemDraft,
    commitItemDraft,
    showIdentifiers,
    showSynchronization,
  };

  return (
    <div className="space-y-1">
      <NestedItemRecursiveRender {...clientProps} />
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
