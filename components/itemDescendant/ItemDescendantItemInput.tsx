// @/components/itemDescendant/ItemDescendantItemInput.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { useState } from "react";
import { ItemDescendantRenderProps } from "./ItemDescendant.client";
import ItemDescendantListItemInput from "./ItemDescendantListItemInput";
import { cn } from "@/lib/utils";

export default function ItemDescendantItemInput(props: ItemDescendantRenderProps) {
  const { id, itemModel, resumeAction } = props;
  const canEdit = resumeAction === "edit";
  const [editingInput, setEditingInput] = useState(canEdit);

  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const itemDraft = store((state) => state.descendantDraft);
  const updateItemDraft = store((state) => state.updateDescendantDraft);
  const commitItemDraft = store((state) => state.commitDescendantDraft);

  return (
    <div key={id} id={id} className="w-full flex gap-x-4 items-center">
      <p
        className={cn("flex-shrink-0 w-48 my-2 text-right text-muted-foreground text-sm", {
          "font-medium text-xl my-4": ["user", "resume"].includes(itemModel),
        })}
      >
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
    </div>
  );
}
