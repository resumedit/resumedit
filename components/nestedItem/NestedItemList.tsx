// @/components/nestedItem/NestedItemList.tsx

import { useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { useResumeAction } from "@/contexts/ResumeActionContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { NestedItemStoreDescendantType } from "@/stores/nestedItemStore/createNestedItemStore";
import { findItemIndexByClientId } from "@/stores/nestedItemStore/utils/descendantOrderValues";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import {
  NestedItemDescendantClientStateType,
  NestedItemClientStateType,
  OrderableItemClientStateType,
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
import NestedItemListItem from "./NestedItemListItem";
import ItemListItemInput from "./NestedItemListItemInput";
import NestedItemSortableWrapper from "./utils/NestedItemSortableWrapper";

const NestedItemList = () => {
  const resumeAction = useResumeAction();
  const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  const storeName = useStoreName();
  const store = useNestedItemStore(storeName);
  const descendants = store((state) => state.descendants);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);
  const reArrangeDescendants = store((state) => state.reArrangeDescendants);
  const resetDescendantsOrderValues = store((state) => state.resetDescendantsOrderValues);

  const settingsStore = useSettingsStore();
  const { showNestedItemInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showNestedItemInternals;

  const descendantsAreDragable = storeName === "achievement" ? true : false;

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
          descendant: NestedItemStoreDescendantType<
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

  return !descendants ? null : (
    <div
      className="bg-elem-light dark:bg-elem-dark-1 mt-5 mb-5 rounded-md shadow-2xl shadow-shadow-light
     dark:shadow-black overflow-hidden"
    >
      {(resumeAction === "edit" && showListItemInternals) ?? (
        <>
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
        </>
      )}
      {
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <ul className="flex flex-col bg-elem-light dark:bg-elem-dark-1 overflow-auto">
            {resumeAction === "edit" ? (
              <ItemListItemInput editingInput={editingInput} setEditingInput={setEditingInput} />
            ) : null}
            {!descendants.map ? null : (
              <NestedItemSortableWrapper items={descendants} disabled={!descendantsAreDragable}>
                {descendants.map(
                  (
                    item: NestedItemStoreDescendantType<
                      NestedItemDescendantClientStateType,
                      NestedItemDescendantClientStateType
                    >,
                    index: number,
                  ) => {
                    return (
                      <NestedItemListItem
                        key={item.clientId}
                        index={index}
                        storeName={storeName}
                        resumeAction={resumeAction}
                        descendantsAreDragable={descendantsAreDragable}
                        item={item as NestedItemClientStateType}
                        markItemAsDeleted={markDescendantAsDeleted}
                      />
                    );
                  },
                )}
              </NestedItemSortableWrapper>
            )}
          </ul>
        </DndContext>
      }
    </div>
  );
};

export default NestedItemList;
