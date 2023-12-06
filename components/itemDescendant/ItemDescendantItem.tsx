// @/components/itemDescendant/ItemDescendantItem.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemDescendantRenderProps } from "./ItemDescendant.client";
import ItemDescendantListItem from "./ItemDescendantListItem";

export default function ItemDescendantItem(props: ItemDescendantRenderProps) {
  const { item, index, resumeAction } = props;
  // const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const setDescendantData = store((state) => state.setDescendantData);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);

  const itemModel = item.itemModel;

  const canEdit = itemModel === "user" ? false : resumeAction === "edit";

  return (
    <ItemDescendantListItem
      index={index}
      itemModel={itemModel}
      item={item}
      setItemData={setDescendantData}
      markItemAsDeleted={markDescendantAsDeleted}
      itemIsDragable={false}
      canEdit={canEdit}
    />
  );
}
