// @/components/itemDescendant/ItemDescendantItem.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemDescendantRenderProps } from "../ItemDescendantList.client";
import DescendantListItem from "./DescendantListItem";

export default function Descendant(props: ItemDescendantRenderProps) {
  const { rootItemModel, item, index, resumeAction } = props;
  // const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const setDescendantData = store((state) => state.setDescendantData);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);

  const itemModel = item.itemModel;

  const canEdit = itemModel === "user" ? false : resumeAction === "edit";

  return (
    <DescendantListItem
      index={index}
      rootItemModel={rootItemModel}
      itemModel={itemModel}
      item={item}
      resumeAction={resumeAction}
      setItemData={setDescendantData}
      markItemAsDeleted={markDescendantAsDeleted}
      itemIsDragable={false}
      canEdit={canEdit}
    />
  );
}
