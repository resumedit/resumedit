// @/components/nestedItem/ParentItemFilteredLists.tsx

import { useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { NestedItemClientStateType } from "@/types/nestedItem";
import NestedItemListItem, { NestedItemListItemProps } from "../NestedItemListItem";
import SortableWrapper from "./NestedItemSortableWrapper";

interface NestedItemFilteredListProps extends NestedItemListItemProps {
  descendants: NestedItemClientStateType[];
}

export default function NestedItemFilteredList({
  resumeAction,
  descendantsAreDragable,
  descendants,
}: NestedItemFilteredListProps) {
  const storeName = useStoreName();
  const store = useNestedItemStore(storeName);
  const setItemDeleted = store((state) => state.markDescendantAsDeleted);

  return (
    <SortableWrapper items={descendants}>
      {descendants.map((item, index) => {
        return (
          <NestedItemListItem
            storeName={storeName}
            resumeAction={resumeAction}
            descendantsAreDragable={descendantsAreDragable}
            index={index}
            key={item.clientId}
            item={item}
            setItemDeleted={setItemDeleted}
          />
        );
      })}
    </SortableWrapper>
  );
}
