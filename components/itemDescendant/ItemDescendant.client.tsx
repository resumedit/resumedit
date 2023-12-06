// @/components/itemDescendant/ItemDescendant.client.tsx

"use client";

import { ItemDescendantStoreProvider, useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { IdSchemaType, getItemId } from "@/schemas/id";
import {
  ItemDescendantClientStateType,
  ItemDescendantServerStateType,
} from "@/stores/itemDescendantStore/createItemDescendantStore";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { ItemClientStateType, ItemDataType, ItemDataUntypedType, ItemServerToClientType } from "@/types/item";
import { ItemDescendantModelNameType, getParentModel } from "@/types/itemDescendant";
import { ResumeActionType } from "@/types/resume";
import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import ItemDescendantItem from "./ItemDescendantItem";
import ItemDescendantItemInput from "./ItemDescendantItemInput";
import { ItemDescendantListSynchronization } from "./ItemDescendantListSynchronization";

export interface ItemDescendantRenderProps {
  index: number;
  id: string;
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>;
  itemModel: ItemDescendantModelNameType;
  rootItemModel: ItemDescendantModelNameType;
  leafItemModel: ItemDescendantModelNameType;
  resumeAction: ResumeActionType;
  editingInput: boolean;
  setEditingInput: Dispatch<SetStateAction<boolean>>;
  setDescendantData: (data: ItemDataUntypedType, clientId: string) => void;
  markDescendantAsDeleted: (clientId: IdSchemaType) => void;
  descendantDraft: ItemDataType<ItemClientStateType>;
  updateDescendantDraft: (descendantData: ItemDataUntypedType) => void;
  commitDescendantDraft: () => void;
  showIdentifiers: boolean;
  showSynchronization: boolean;
}
function ItemDescendantRender(props: ItemDescendantRenderProps): ReactNode {
  const { item, rootItemModel, leafItemModel, resumeAction } = props;
  const { itemModel, descendantModel, descendants } = item;

  // console.log(`ItemDescendantRender: ${JSON.stringify(item, undefined, 2)}`);

  const atRootLevel = itemModel === rootItemModel;

  const renderItem = () => {
    return <ItemDescendantItem {...props} />;
  };

  return !descendantModel || item.deletedAt ? null : (
    <>
      {atRootLevel && resumeAction === "edit" ? <ItemDescendantListSynchronization /> : null}
      {renderItem()}
      {item.itemModel !== leafItemModel &&
        descendants
          ?.filter((descendant) => !descendant.deletedAt)
          .map((descendant, descendantIndex) => (
            <ItemDescendantRender
              {...props}
              key={descendant.clientId}
              id={descendant.clientId}
              index={descendantIndex}
              item={descendant}
              itemModel={descendantModel}
            />
          ))}
      {item.itemModel === leafItemModel ? null : (
        <ItemDescendantItemInput {...{ ...props, itemModel: descendantModel }} />
      )}
    </>
  );
}

interface ItemDescendantClientContextProps extends ItemDescendantClientComponentProps {}
function ItemDescendantClientContext(props: ItemDescendantClientContextProps) {
  const [isStoreInitialized, setStoreInitialized] = useState(false);

  const globalStoreName = useStoreName();
  const store = useItemDescendantStore(globalStoreName);
  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);
  const [editingInput, setEditingInput] = useState(props.resumeAction === "edit");
  const setDescendantData = store((state) => state.setDescendantData);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);

  const descendantDraft = store((state) => state.descendantDraft);
  const updateDescendantDraft = store((state) => state.updateDescendantDraft);
  const commitDescendantDraft = store((state) => state.commitDescendantDraft);

  const settingsStore = useSettingsStore();
  const { showItemDescendantIdentifiers, showItemDescendantSynchronization } = settingsStore;
  const showIdentifiers = process.env.NODE_ENV === "development" && showItemDescendantIdentifiers;
  const showSynchronization = process.env.NODE_ENV === "development" && showItemDescendantSynchronization;

  const { serverState } = props;

  const clientProps = {
    ...props,
    index: 0,
    item: rootState,
    itemModel: props.rootItemModel,
    editingInput,
    setEditingInput,
    setDescendantData,
    markDescendantAsDeleted,
    descendantDraft,
    updateDescendantDraft,
    commitDescendantDraft,
    showIdentifiers,
    showSynchronization,
  };

  // console.log(
  //   `ItemDescendantClientContext: ${JSON.stringify(
  //     rootState.descendants.filter((descendant) => !descendant.deletedAt),
  //     undefined,
  //     2,
  //   )}`,
  // );
  useEffect(() => {
    if (updateStoreWithServerData && !isStoreInitialized) {
      console.log(`ItemDescendantClientContext: useEffect with serverState:`, serverState);
      updateStoreWithServerData(serverState);
      setStoreInitialized(true);
    }
  }, [serverState, isStoreInitialized, updateStoreWithServerData]);

  return !isStoreInitialized ? null : <ItemDescendantRender {...clientProps} id={clientProps.item.clientId} />;
}

export interface ItemDescendantClientComponentProps {
  serverState: ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType>;
  rootItemModel: ItemDescendantModelNameType;
  leafItemModel: ItemDescendantModelNameType;
  resumeAction: ResumeActionType;
}

export default function ItemDescendantClientComponent(props: ItemDescendantClientComponentProps) {
  const { serverState, resumeAction } = props;

  const itemModel = serverState.itemModel;
  const parentClientId = getItemId(getParentModel(itemModel));
  const clientId = getItemId(itemModel!);
  const parentId = serverState.parentId;
  const id = serverState.id;
  const storeVersion = 1; // Or any logic to determine the version
  const logUpdateFromServer = process.env.NODE_ENV === "development";

  return (
    <ResumeActionProvider resumeAction={resumeAction}>
      <StoreNameProvider storeName={`${itemModel}`}>
        <ItemDescendantStoreProvider
          configs={[{ itemModel, parentClientId, clientId, parentId, id, storeVersion, logUpdateFromServer }]}
        >
          <ItemDescendantClientContext {...props} />
        </ItemDescendantStoreProvider>
      </StoreNameProvider>
    </ResumeActionProvider>
  );
}