// @/components/itemDescendant/ItemDescendantFilteredLists.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemClientStateDescendantListType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemClientStateType } from "@/types/item";
import DescendantListItem, { DescendantListItemProps } from "../descendant/DescendantListItem";
import SortableWrapper from "./ItemDescendantSortableWrapper";

interface ItemDescendantFilteredListProps extends DescendantListItemProps {
  descendants: ItemClientStateDescendantListType<ItemClientStateType, ItemClientStateType>;
}

export default function ItemDescendantFilteredLists({
  rootItemModel,
  itemModel,
  canEdit,
  itemIsDragable,
  descendants,
}: ItemDescendantFilteredListProps) {
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const setDescendantData = store((state) => state.setDescendantData);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);

  return (
    <SortableWrapper items={descendants}>
      {descendants.map((item, index) => {
        return (
          <DescendantListItem
            index={index}
            key={item.clientId}
            rootItemModel={rootItemModel}
            itemModel={itemModel}
            item={item}
            setItemData={setDescendantData}
            markItemAsDeleted={markDescendantAsDeleted}
            canEdit={canEdit}
            itemIsDragable={itemIsDragable}
          />
        );
      })}
    </SortableWrapper>
  );
}
