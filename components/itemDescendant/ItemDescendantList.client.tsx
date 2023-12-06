// @/components/itemDescendant/ItemDescendant.client.tsx

"use client";

import { ItemDescendantStoreProvider, useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { getClientId } from "@/schemas/id";
import { ItemClientStateType, ItemDataType, ItemDataUntypedType } from "@/schemas/item";
import { ItemDescendantClientStateType, ItemDescendantServerStateType } from "@/schemas/itemDescendant";
import useAppSettingsStore from "@/stores/appSettings/useAppSettingsStore";
import { ClientIdType } from "@/types/item";
import { ItemDescendantModelNameType, getDescendantModel, getParentModel } from "@/types/itemDescendant";
import { ResumeActionType } from "@/types/resume";
import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import Item from "./Item";
import RestoreItemDialog from "./RestoreItemDialog";
import Descendant from "./descendant/Descendant";
import DescendantInput from "./descendant/DescendantInput";
import DescendantList from "./descendant/DescendantList";
import { ItemDescendantListSynchronization } from "./utils/ItemDescendantListSynchronization";

export interface ItemDescendantRenderProps {
  index: number;
  ancestorClientIdChain: Array<ClientIdType>;
  // id: string;
  item: ItemDescendantClientStateType;
  itemModel: ItemDescendantModelNameType;
  rootItemModel: ItemDescendantModelNameType;
  leafItemModel: ItemDescendantModelNameType;
  resumeAction: ResumeActionType;
  editingInput: boolean;
  setEditingInput: Dispatch<SetStateAction<boolean>>;
  setDescendantData: (
    descendantData: ItemDataUntypedType,
    clientId: ClientIdType,
    ancestorClientIds: Array<ClientIdType>,
  ) => void;
  // addDescendant: (descendantData: ItemDataType<C>) => void; // FIXME: Untested
  markDescendantAsDeleted: (clientId: ClientIdType, ancestorClientIds: Array<ClientIdType>) => void;
  // reArrangeDescendants: (reArrangedDescendants: ItemDescendantClientStateListType) => void;
  // resetDescendantsOrderValues: () => void;
  getDescendantDraft: (ancestorClientIds: Array<ClientIdType>) => ItemDataType<ItemClientStateType>;
  updateDescendantDraft: (descendantData: ItemDataUntypedType, ancestorClientIds: Array<ClientIdType>) => void;
  commitDescendantDraft: (ancestorClientIds: Array<ClientIdType>) => void;
  showIdentifiers: boolean;
  showSynchronization: boolean;
}
function ItemDescendantListRender(props: ItemDescendantRenderProps): ReactNode {
  const { ancestorClientIdChain, item, rootItemModel, leafItemModel, editingInput } = props;
  const { itemModel, descendantModel, descendants } = item;

  const atRootLevel = itemModel === rootItemModel;
  if (!descendantModel) return;

  const descendantDescendantModel = getDescendantModel(descendantModel);

  // Props for descendants of current item have the same ancestorClientIdChain
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const descendantProps = {
    ...props,
    itemModel: descendantModel,
    descendantModel: descendantDescendantModel,
    parentId: item.id,
    parentClientId: item.clientId,
    ancestorClientIdChain: [item.clientId, ...ancestorClientIdChain],
  };

  return (
    <>
      {item.deletedAt ? <RestoreItemDialog {...descendantProps} /> : null}
      {atRootLevel && editingInput ? <ItemDescendantListSynchronization /> : null}
      {atRootLevel ? <Item {...props} /> : <Descendant {...props} />}
      {item.descendantModel === leafItemModel ? (
        <DescendantList {...descendantProps} />
      ) : (
        <>
          {!editingInput || item.descendantModel === leafItemModel || !descendantDescendantModel ? (
            <pre>{`!editingInput=${!editingInput}\nitem.descendantModel === leafItemModel=${
              item.descendantModel === leafItemModel
            }\n!descendantDescendantModel=${!descendantDescendantModel}`}</pre>
          ) : (
            <DescendantInput {...descendantProps} />
          )}
          <ul key={item.clientId}>
            {descendants
              ?.filter((descendant) => !descendant.deletedAt)
              .map((descendant, descendantIndex) => (
                <li key={descendant.clientId}>
                  <ItemDescendantListRender {...descendantProps} index={descendantIndex} item={descendant} />
                  {/*
                    !editingInput || item.descendantModel === leafItemModel || !descendantDescendantModel ? (
                      <div>{`editingInput=${editingInput} item.descendantModel === leafItemModel=${
                        item.descendantModel === leafItemModel
                      } !descendantDescendantModel=${!descendantDescendantModel}: Not showing <DescendantInput />`}</div>
                    ) : null
                    <DescendantInput {...descendantProps} />
                  */}
                </li>
              ))}
          </ul>
        </>
      )}
    </>
  );
}

interface ItemDescendantListStateProps extends ItemDescendantListContextProps {}
function ItemDescendantListState(props: ItemDescendantListStateProps) {
  const [isStoreInitialized, setStoreInitialized] = useState(false);

  const globalStoreName = useStoreName();
  const store = useItemDescendantStore(globalStoreName);
  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);
  const [editingInput, setEditingInput] = useState(props.resumeAction === "edit");
  const setDescendantData = store((state) => state.setDescendantData);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);

  const getDescendantDraft = store((state) => state.getDescendantDraft);
  const updateDescendantDraft = store((state) => state.updateDescendantDraft);
  const commitDescendantDraft = store((state) => state.commitDescendantDraft);

  const settingsStore = useAppSettingsStore();
  const { showItemDescendantIdentifiers, showItemDescendantSynchronization } = settingsStore;
  const showIdentifiers = process.env.NODE_ENV === "development" && showItemDescendantIdentifiers;
  const showSynchronization = process.env.NODE_ENV === "development" && showItemDescendantSynchronization;

  const { serverState } = props;

  const clientProps = {
    ...props,
    index: 0,
    ancestorClientIdChain: [],
    item: rootState,
    itemModel: props.rootItemModel,
    editingInput,
    setEditingInput,
    setDescendantData,
    markDescendantAsDeleted,
    getDescendantDraft,
    updateDescendantDraft,
    commitDescendantDraft,
    showIdentifiers,
    showSynchronization,
  };

  // window.consoleLog(
  //   `ItemDescendantClientContext: ${JSON.stringify(
  //     rootState.descendants.filter((descendant) => !descendant.deletedAt),
  //     undefined,
  //     2,
  //   )}`,
  // );
  useEffect(() => {
    if (updateStoreWithServerData && !isStoreInitialized) {
      // window.consoleLog(`ItemDescendantClientContext: useEffect with serverState:`, serverState);
      updateStoreWithServerData(serverState);
      setStoreInitialized(true);
    }
  }, [serverState, isStoreInitialized, updateStoreWithServerData]);

  return !isStoreInitialized ? null : <ItemDescendantListRender {...clientProps} />;
}

export interface ItemDescendantListContextProps {
  serverState: ItemDescendantServerStateType;
  rootItemModel: ItemDescendantModelNameType;
  leafItemModel: ItemDescendantModelNameType;
  resumeAction: ResumeActionType;
}

export default function ItemDescendantListContext(props: ItemDescendantListContextProps) {
  const { serverState, rootItemModel: itemModel, resumeAction } = props;

  const parentClientId = getClientId(getParentModel(itemModel));
  const clientId = getClientId(itemModel!);
  const parentId = serverState.parentId;
  const id = serverState.id;
  const storeVersion = 1; // FIXME: add logic to determine the version from the serverUpdate

  return (
    <ResumeActionProvider resumeAction={resumeAction}>
      <StoreNameProvider storeName={`${itemModel}`}>
        <ItemDescendantStoreProvider configs={[{ itemModel, parentClientId, clientId, parentId, id, storeVersion }]}>
          <ItemDescendantListState {...props} />
        </ItemDescendantStoreProvider>
      </StoreNameProvider>
    </ResumeActionProvider>
  );
}
