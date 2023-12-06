// @/components/item/ParentItemList.tsx

import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemClientStateType } from "@/types/item";
import ParentItemListItem from "./ParentItemListItem";
import ParentItemListItemInput from "./ParentItemListItemInput";
import ParentItemSortableWrapper from "./utils/ParentItemSortableWrapper";

const ParentItemList = () => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const items = store((state) => state.items);
  const deleteItemsByDisposition = store((state) => state.deleteItemsByDisposition);
  const setItemDeleted = store((state) => state.setItemDeleted);

  return !items || !deleteItemsByDisposition ? null : (
    <div
      className="bg-elem-light dark:bg-elem-dark-1 mt-5 mb-5 rounded-md shadow-2xl shadow-shadow-light
     dark:shadow-black overflow-hidden"
    >
      <div className="m-3 space-x-2">
        <button
          className="px-1 border-2 text-destructive rounded-md"
          name="deleteItemsByDisposition"
          role="button"
          onClick={() => {
            deleteItemsByDisposition();
          }}
        >
          Remove deleted
        </button>
      </div>
      {
        <ul className="flex flex-col bg-elem-light dark:bg-elem-dark-1 overflow-auto">
          <ParentItemSortableWrapper items={items}>
            <ParentItemListItemInput />
            {items.map((item, index) => {
              return (
                <ParentItemListItem
                  storeName={storeName}
                  key={item.clientId}
                  index={index}
                  item={item as ItemClientStateType}
                  setItemDeleted={setItemDeleted}
                />
              );
            })}
          </ParentItemSortableWrapper>
        </ul>
      }
    </div>
  );
};

export default ParentItemList;
