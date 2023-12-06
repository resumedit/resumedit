// @/components/item/ParentItemFilteredLists.tsx

import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemClientStateType } from "@/types/item";
import ParentItemListItem from "../ParentItemListItem";
import SortableWrapper from "./ParentItemSortableWrapper";

interface Props {
  items: ItemClientStateType[];
}

const ParentItemFilteredLists = ({ items }: Props) => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const setItemDeleted = store((state) => state.setItemDeleted);

  return (
    <SortableWrapper items={items}>
      {items.map((item, index) => {
        return (
          <ParentItemListItem
            storeName={storeName}
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

export default ParentItemFilteredLists;
