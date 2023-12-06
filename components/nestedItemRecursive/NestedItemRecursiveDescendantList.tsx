// @/components/nestedItemRecursive/NestedItemRecursiveDescendantList.tsx

import { useNestedItemRecursiveStore } from "@/contexts/NestedItemRecursiveStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { NestedItemRecursiveStoreDescendantType } from "@/stores/nestedItemRecursiveStore/createNestedItemRecursiveStore";
import { findItemIndexByClientId } from "@/stores/nestedItemStore/utils/descendantOrderValues";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import {
  NestedItemDescendantClientStateType,
  OrderableItemClientStateType,
  getDescendantModel,
} from "@/types/nestedItem";
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
import NestedItemSortableWrapper from "../nestedItem/utils/NestedItemSortableWrapper";
import { NestedItemRecursiveRenderProps } from "./NestedItemRecursive.client";
import NestedItemRecursiveListItem from "./NestedItemRecursiveListItem";
import NestedItemRecursiveListItemInput from "./NestedItemRecursiveListItemInput";

interface NestedItemRecursiveDescendantListProps extends NestedItemRecursiveRenderProps {}
export default function NestedItemRecursiveDescendantList({
  serverState,
  resumeAction,
}: NestedItemRecursiveDescendantListProps) {
  const canEdit = resumeAction === "edit";
  const [editingInput, setEditingInput] = useState(canEdit);
  const settingsStore = useSettingsStore();
  const { showNestedItemInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showNestedItemInternals;

  const itemModel = serverState.itemModel;
  const descendantModel = getDescendantModel(itemModel);
  const descendantsAreDragable = itemModel === "achievement" ? true : false;

  const storeName = useStoreName();
  const store = useNestedItemRecursiveStore(storeName);
  const descendants = store((state) => state.descendants);
  const reArrangeDescendants = store((state) => state.reArrangeDescendants);
  const resetDescendantsOrderValues = store((state) => state.resetDescendantsOrderValues);

  const descendantDraft = store((state) => state.descendantDraft);
  const updateDescendantDraft = store((state) => state.updateDescendantDraft);
  const commitDescendantDraft = store((state) => state.commitDescendantDraft);

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

      // Create a new array with updated 'moved' properties
      const updatedDescendants = descendants.map(
        (
          descendant: NestedItemRecursiveStoreDescendantType<
            NestedItemDescendantClientStateType,
            NestedItemDescendantClientStateType
          >,
          index: number,
        ) => {
          if (index === activeIndex || index === overIndex) {
            return { ...descendant, moved: true };
          }
          return descendant;
        },
      );

      // Update the state with the new array
      reArrangeDescendants(arrayMove(updatedDescendants as OrderableItemClientStateType[], activeIndex, overIndex));
    }
  };

  return (
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <ul className="flex flex-col bg-elem-light dark:bg-elem-dark-1 overflow-auto">
          {descendantModel && canEdit ? (
            <NestedItemRecursiveListItemInput
              itemModel={descendantModel}
              itemDraft={descendantDraft}
              updateItemDraft={updateDescendantDraft}
              commitItemDraft={commitDescendantDraft}
              editingInput={editingInput}
              setEditingInput={setEditingInput}
              canEdit={canEdit}
            />
          ) : null}
          {!descendantModel ? null : (
            <NestedItemSortableWrapper items={descendants} disabled={!descendantsAreDragable}>
              {descendants.map(
                (
                  item: NestedItemRecursiveStoreDescendantType<
                    NestedItemDescendantClientStateType,
                    NestedItemDescendantClientStateType
                  >,
                  index: number,
                ) => {
                  const setDescendantData = store((state) => state.setDescendantData);
                  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);
                  return (
                    <NestedItemRecursiveListItem
                      key={item.clientId}
                      index={index}
                      itemModel={descendantModel}
                      item={
                        item as NestedItemRecursiveStoreDescendantType<
                          NestedItemDescendantClientStateType,
                          NestedItemDescendantClientStateType
                        >
                      }
                      setItemData={setDescendantData}
                      markItemAsDeleted={markDescendantAsDeleted}
                      itemIsDragable={descendantsAreDragable}
                      canEdit={canEdit}
                    />
                  );
                },
              )}
            </NestedItemSortableWrapper>
          )}
        </ul>
      </DndContext>
    </>
  );
}
