// @/components/nestedItemRecursive/NestedItemRecursiveItemInput.tsx

import { useNestedItemRecursiveStore } from "@/contexts/NestedItemRecursiveStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { useState } from "react";
import { NestedItemRecursiveRenderProps } from "./NestedItemRecursive.client";
import NestedItemRecursiveListItemInput from "./NestedItemRecursiveListItemInput";

export default function NestedItemRecursiveItemInput(props: NestedItemRecursiveRenderProps) {
  const { serverState, resumeAction } = props;
  const canEdit = resumeAction === "edit";
  const [editingInput, setEditingInput] = useState(canEdit);
  const storeName = useStoreName();
  const store = useNestedItemRecursiveStore(storeName);
  const itemDraft = store((state) => state.descendantDraft);
  const updateItemDraft = store((state) => state.updateDescendantDraft);
  const commitItemDraft = store((state) => state.commitDescendantDraft);
  const itemModel = serverState.itemModel;

  return (
    <>
      <p className="font-medium text-xl my-4">Add new {itemModel}</p>
      <NestedItemRecursiveListItemInput
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
