// @/components/nestedItemRecursive/NestedItemRecursiveList.tsx

import { useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { NestedItemStoreDescendantType } from "@/stores/nestedItemStore/createNestedItemStore";
import { findItemIndexByClientId } from "@/stores/nestedItemStore/utils/descendantOrderValues";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import {
  NestedItemDescendantClientStateType,
  NestedItemClientStateType,
  OrderableItemClientStateType,
  nestedItemModelHierarchy,
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
import { NestedItemRecursiveProps } from "./NestedItemRecursive.client";
import NestedItemRecursiveListItem from "./NestedItemRecursiveListItem";
import NestedItemRecursiveListItemInput from "./NestedItemRecursiveListItemInput";

interface NestedItemRecursiveListDescendantListProps extends NestedItemRecursiveProps {}
function NestedItemRecursiveListDescendantList({
  serverState,
  resumeAction,
}: NestedItemRecursiveListDescendantListProps) {
  const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  // const storeName = useStoreName();
  // const store = useNestedItemStore(storeName);
  // const descendants = store((state) => state.descendants);
  // const setDescendantDeleted = store((state) => state.markDescendantAsDeleted);
  // const reArrangeDescendants = store((state) => state.reArrangeDescendants);
  // const resetDescendantsOrderValues = store((state) => state.resetDescendantsOrderValues);

  const storeName = serverState.itemModel;

  const descendants = serverState.descendants;
  const setDescendantDeleted = () => {
    console.log(`setDescendantDeleted`);
  };
  const reArrangeDescendants = () => {
    console.log(`reArrangeDescendants`);
  };
  const resetDescendantsOrderValues = () => {
    console.log(`resetDescendantsOrderValues`);
  };

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

  return (
    <>
      {resumeAction === "edit" && showListItemInternals ? (
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
          {resumeAction === "edit" ? (
            <NestedItemRecursiveListItemInput
              editingInput={editingInput}
              setEditingInput={setEditingInput}
              storeName={storeName}
              resumeAction={resumeAction}
            />
          ) : null}
          {serverState.itemModel !== nestedItemModelHierarchy[nestedItemModelHierarchy.length - 1] ? null : (
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
                    <NestedItemRecursiveListItem
                      key={item.clientId}
                      index={index}
                      storeName={storeName}
                      resumeAction={resumeAction}
                      descendantsAreDragable={descendantsAreDragable}
                      item={item as NestedItemClientStateType}
                      setItemDeleted={setDescendantDeleted}
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

export default function NestedItemRecursiveList(props: NestedItemRecursiveProps) {
  const { serverState, resumeAction } = props;
  // const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  // const storeName = useStoreName();
  // const store = useNestedItemStore(storeName);
  // const descendants = store((state) => state.descendants);
  // const setDescendantDeleted = store((state) => state.markDescendantAsDeleted);

  const descendants = serverState.descendants;
  const setDescendantDeleted = () => {
    console.log(`setDescendantDeleted`);
  };

  const settingsStore = useSettingsStore();
  const { showNestedItemInternals } = settingsStore;
  // const showListItemInternals = process.env.NODE_ENV === "development" && showNestedItemInternals;

  return (
    <div
      className="bg-elem-light dark:bg-elem-dark-1 mt-5 mb-5 rounded-md shadow-2xl shadow-shadow-light
     dark:shadow-black overflow-hidden"
    >
      <div>
        <NestedItemRecursiveListItem
          storeName={serverState.itemModel}
          resumeAction={resumeAction}
          descendantsAreDragable={false}
          index={0}
          item={serverState as NestedItemClientStateType}
          setItemDeleted={setDescendantDeleted}
        />
      </div>
      {!descendants ? null : <NestedItemRecursiveListDescendantList {...props} />}
    </div>
  );
}
