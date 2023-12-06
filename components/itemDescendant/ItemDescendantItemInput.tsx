// @/components/itemDescendant/ItemDescendantItemInput.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { useState } from "react";
import { ItemDescendantRenderProps } from "./ItemDescendant.client";
import ItemDescendantListItemInput from "./ItemDescendantListItemInput";
import { cn } from "@/lib/utils";

export default function ItemDescendantItemInput(props: ItemDescendantRenderProps) {
  const { itemModel, resumeAction } = props;
  const canEdit = resumeAction === "edit";
  const [editingInput, setEditingInput] = useState(canEdit);

  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const itemDraft = store((state) => state.descendantDraft);
  const updateItemDraft = store((state) => state.updateDescendantDraft);
  const commitItemDraft = store((state) => state.commitDescendantDraft);

  return (
    <>
      <p className={cn("my-2", { "font-medium text-xl my-4": ["user", "resume"].includes(itemModel) })}>
        Add new {itemModel}
      </p>
      <ItemDescendantListItemInput
        itemModel={itemModel}
        itemDraft={itemDraft}
        updateItemDraft={updateItemDraft}
        commitItemDraft={commitItemDraft}
        editingInput={editingInput}
        setEditingInput={setEditingInput}
        canEdit={canEdit}
      />
    </>
  );
}
