// @/components/itemDescendant/ItemDescendantItem.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemDataUntypedType } from "@/schemas/item";
import { ClientIdType } from "@/types/item";
import { ItemDescendantRenderProps } from "../ItemDescendantList.client";
import DescendantListItemPersist from "./DescendantListItemPersist";

export default function Descendant(props: ItemDescendantRenderProps) {
  const { ancestorClientIdChain, item, index, resumeAction } = props;
  // const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const setDescendantData = store((state) => state.setDescendantData);
  const markDescendantAsDeleted = store((state) => state.markDescendantAsDeleted);

  const setItemData = (descendantData: ItemDataUntypedType, clientId: ClientIdType): void => {
    window.consoleLog(
      `Descendant:setItemData(descendantData=${descendantData}): ancestorClientIdChain=${JSON.stringify(
        ancestorClientIdChain,
      )}`,
    );
    setDescendantData(descendantData, clientId, ancestorClientIdChain);
  };

  const markItemAsDeleted = (clientId: ClientIdType): void => {
    window.consoleLog(
      `Descendant:markDescendantAsDeleted(clientId=${clientId}): parentItem=${JSON.stringify(ancestorClientIdChain)}`,
    );
    markDescendantAsDeleted(clientId, ancestorClientIdChain);
  };

  const canEdit = item.itemModel === "user" ? false : resumeAction === "edit";

  return (
    <DescendantListItemPersist
      {...props}
      index={index}
      setItemData={setItemData}
      markItemAsDeleted={markItemAsDeleted}
      itemIsDragable={false}
      canEdit={canEdit}
    />
  );
}
