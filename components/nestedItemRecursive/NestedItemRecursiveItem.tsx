// @/components/nestedItemRecursive/NestedItemRecursiveItem.tsx

import { useNestedItemRecursiveStore } from "@/contexts/NestedItemRecursiveStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { NestedItemRecursiveStoreDescendantType } from "@/stores/nestedItemRecursiveStore/createNestedItemRecursiveStore";
import { NestedItemDescendantClientStateType } from "@/types/nestedItem";
import { NestedItemRecursiveRenderProps } from "./NestedItemRecursive.client";
import NestedItemRecursiveListItem from "./NestedItemRecursiveListItem";

export default function NestedItemRecursiveItem(props: NestedItemRecursiveRenderProps) {
  const { serverState, resumeAction } = props;
  // const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  const storeName = useStoreName();
  const store = useNestedItemRecursiveStore(storeName);
  const setItemData = store((state) => state.setItemData);
  const markItemAsDeleted = store((state) => state.markItemAsDeleted);

  const itemModel = serverState.itemModel;

  const canEdit = itemModel === "user" ? false : resumeAction === "edit";

  return (
    <NestedItemRecursiveListItem
      index={0}
      itemModel={itemModel}
      item={
        serverState as NestedItemRecursiveStoreDescendantType<
          NestedItemDescendantClientStateType,
          NestedItemDescendantClientStateType
        >
      }
      setItemData={setItemData}
      markItemAsDeleted={markItemAsDeleted}
      itemIsDragable={false}
      canEdit={canEdit}
    />
  );
}
