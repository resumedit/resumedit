// @/components/item/ParentItemFilteredLists.tsx

import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemClientStateType } from "@/types/item";
import ItemListItem, { ParentItemListItemProps } from "../ItemListItem";
import SortableWrapper from "./ParentItemSortableWrapper";

interface ParentItemFilteredListProps extends ParentItemListItemProps {
  items: ItemClientStateType[];
}

const ParentItemFilteredList = ({ resumeAction, itemsAreDragable, items }: ParentItemFilteredListProps) => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const markItemAsDeleted = store((state) => state.markItemAsDeleted);

  return (
    <SortableWrapper items={items}>
      {items.map((item, index) => {
        return (
          <ItemListItem
            storeName={storeName}
            resumeAction={resumeAction}
            itemsAreDragable={itemsAreDragable}
            index={index}
            key={item.clientId}
            item={item}
            markItemAsDeleted={markItemAsDeleted}
          />
        );
      })}
    </SortableWrapper>
  );
};

export default ParentItemFilteredList;
