// @/components/item/ParentItemFilteredLists.tsx

import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemClientStateType } from "@/types/item";
import ParentItemListItem, { ParentItemListItemProps } from "../ParentItemListItem";
import SortableWrapper from "./ParentItemSortableWrapper";

interface ParentItemFilteredListProps extends ParentItemListItemProps {
  items: ItemClientStateType[];
}

const ParentItemFilteredList = ({ resumeAction, itemsAreDragable, items }: ParentItemFilteredListProps) => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const setItemDeleted = store((state) => state.setItemDeleted);

  return (
    <SortableWrapper items={items}>
      {items.map((item, index) => {
        return (
          <ParentItemListItem
            storeName={storeName}
            resumeAction={resumeAction}
            itemsAreDragable={itemsAreDragable}
            index={index}
            key={item.clientId}
            item={item}
            setItemDeleted={setItemDeleted}
          />
        );
      })}
    </SortableWrapper>
  );
};

export default ParentItemFilteredList;
