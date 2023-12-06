// @/components/itemDescendant/ItemDescendantItem.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { IdSchemaType } from "@/schemas/id";
import { ItemDescendantRenderProps } from "../ItemDescendantList.client";
import DescendantListItem from "./DescendantListItem";
import { ClientIdType, ItemDataUntypedType } from "@/types/item";

export default function Descendant(props: ItemDescendantRenderProps) {
  const { rootItemModel, ancestorClientIdChain, item, index, resumeAction } = props;
  // const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const setDescendantData = store((state) => state.setDescendantData);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);

  const setItemData = (descendantData: ItemDataUntypedType, clientId: ClientIdType): void => {
    console.log(
      `Descendant:setItemData(descendantData=${descendantData}): ancestorClientIdChain=${JSON.stringify(
        ancestorClientIdChain,
      )}`,
    );
    setDescendantData(descendantData, clientId, ancestorClientIdChain);
  };

  const markItemAsDeleted = (clientId: IdSchemaType): void => {
    console.log(
      `Descendant:markDescendantAsDeleted(clientId=${clientId}): parentItem=${JSON.stringify(ancestorClientIdChain)}`,
    );
    markDescendantAsDeleted(clientId, ancestorClientIdChain);
  };

  const itemModel = item.itemModel;

  const canEdit = itemModel === "user" ? false : resumeAction === "edit";

  return (
    <DescendantListItem
      index={index}
      rootItemModel={rootItemModel}
      itemModel={itemModel}
      item={item}
      resumeAction={resumeAction}
      setItemData={setItemData}
      markItemAsDeleted={markItemAsDeleted}
      itemIsDragable={false}
      canEdit={canEdit}
    />
  );
}
