// @/components/itemDescendant/ItemDescendantList.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { IdSchemaType } from "@/schemas/id";
import { ItemDescendantClientStateType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { findItemIndexByClientId } from "@/stores/itemDescendantStore/utils/descendantOrderValues";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { ClientIdType, ItemClientStateType, ItemDataType, ItemDataUntypedType } from "@/types/item";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { ItemDescendantRenderProps } from "../ItemDescendantList.client";
import ItemDescendantSortableWrapper from "../utils/ItemDescendantSortableWrapper";
import DescendantInput from "./DescendantInput";
import DescendantListItem from "./DescendantListItem";
import DescendantListItemInput from "./DescendantListItemInput";

interface ItemDescendantListProps extends ItemDescendantRenderProps {}
export default function DescendantList(props: ItemDescendantListProps) {
  const { ancestorClientIdChain, rootItemModel, leafItemModel, itemModel, item, resumeAction } = props;

  const canEdit = resumeAction === "edit";
  // const [editingInput, setEditingInput] = useState(canEdit);

  const isRootItemModel = itemModel === rootItemModel;
  const isLeafItemModel = itemModel === leafItemModel;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [inlineInsert, setInlineInsert] = useState(!isRootItemModel && !isLeafItemModel);

  const settingsStore = useSettingsStore();
  const { showItemDescendantInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showItemDescendantInternals;

  const descendantModel = item.descendantModel;
  const descendantsAreDragable = descendantModel === "achievement" ? true : false;

  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const descendants = store((state) => state.descendants);

  const reArrangeDescendants = store((state) => state.reArrangeDescendants);
  const resetDescendantsOrderValues = store((state) => state.resetDescendantsOrderValues);
  const setDescendantData = store((state) => state.setDescendantData);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);

  const setItemData = (descendantData: ItemDataUntypedType, clientId: ClientIdType): void => {
    console.log(
      `Descendant:setItemData(descendantData=${descendantData}): ancestorClientIdChain=${JSON.stringify(
        ancestorClientIdChain,
      )}`,
    );
    setDescendantData(descendantData, clientId, ancestorClientIdChain);
  };

  const markItemAsDeleted = (clientId: IdSchemaType): void => {
    console.log(
      `Descendant:markDescendantAsDeleted(clientId=${clientId}): ancestorClientIdChain=${JSON.stringify(
        ancestorClientIdChain,
      )}`,
    );
    markDescendantAsDeleted(clientId, ancestorClientIdChain);
  };

  const getDescendantDraft = store((state) => state.getDescendantDraft);
  const updateDescendantDraft = store((state) => state.updateDescendantDraft);
  const commitDescendantDraft = store((state) => state.commitDescendantDraft);

  const itemDraft = (clientId: IdSchemaType): ItemDataType<ItemClientStateType> => {
    console.log(
      `DescendantInput:itemDraft(clientId=${clientId}): ancestorClientIdChain=${JSON.stringify(ancestorClientIdChain)}`,
    );
    return getDescendantDraft(ancestorClientIdChain);
  };
  const updateItemDraft = (descendantData: ItemDataUntypedType): void => {
    console.log(
      `DescendantInput:updateItemDraft(descendantData=${descendantData}): ancestorClientIdChain=${JSON.stringify(
        ancestorClientIdChain,
      )}`,
    );
    updateDescendantDraft(descendantData, ancestorClientIdChain);
  };

  const commitItemDraft = (): void => {
    console.log(`DescendantInput:commitItemDraft(): ancestorClientIdChain=${JSON.stringify(ancestorClientIdChain)}`);
    commitDescendantDraft(ancestorClientIdChain);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over!.id) {
      const activeIndex = findItemIndexByClientId(descendants, active.id as string);
      const overIndex = findItemIndexByClientId(descendants, over!.id as string);

      // Return a new array
      const updatedDescendants = descendants.map(
        (descendant: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>, index: number) => {
          if (index === activeIndex || index === overIndex) {
            return { ...descendant };
          }
          return descendant;
        },
      );

      // Update the state with the new array
      reArrangeDescendants(arrayMove(updatedDescendants, activeIndex, overIndex));
    }
  };

  return !descendantModel ? null : (
    <>
      {canEdit && showListItemInternals ? (
        <button
          className="px-1 border-2 text-primary rounded-md"
          name="resetDescendantsOrderValues"
          role="button"
          onClick={() => {
            resetDescendantsOrderValues();
          }}
        >
          Reset order
        </button>
      ) : null}
      {canEdit && !inlineInsert ? <DescendantInput {...props} itemModel={descendantModel} /> : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <ul className="flex flex-col bg-elem-light dark:bg-elem-dark-1 overflow-auto">
          {canEdit && inlineInsert ? (
            <DescendantListItemInput
              itemModel={descendantModel}
              itemDraft={itemDraft}
              updateItemDraft={updateItemDraft}
              commitItemDraft={commitItemDraft}
              // editingInput={editingInput}
              // setEditingInput={setEditingInput}
              canEdit={canEdit}
            />
          ) : null}
          <ItemDescendantSortableWrapper items={descendants} disabled={!descendantsAreDragable}>
            {descendants.map(
              (item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>, index: number) => {
                return (
                  <DescendantListItem
                    key={item.clientId}
                    index={index}
                    rootItemModel={rootItemModel}
                    itemModel={descendantModel}
                    item={item as ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>}
                    resumeAction={resumeAction}
                    setItemData={setItemData}
                    markItemAsDeleted={markItemAsDeleted}
                    itemIsDragable={descendantsAreDragable}
                    canEdit={canEdit}
                  />
                );
              },
            )}
          </ItemDescendantSortableWrapper>
        </ul>
      </DndContext>
    </>
  );
}
