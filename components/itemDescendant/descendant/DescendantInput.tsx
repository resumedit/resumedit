// @/components/itemDescendant/descendant/DescendantInput.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
// import { useState } from "react";
import { cn } from "@/lib/utils";
import { ItemClientStateType, ItemDataType, ItemDataUntypedType } from "@/types/item";
import { ItemDescendantRenderProps } from "../ItemDescendantList.client";
import DescendantListItemInput from "./DescendantListItemInput";

export default function DescendantInput(props: ItemDescendantRenderProps) {
  const { ancestorClientIdChain, item, itemModel, resumeAction } = props;
  const canEdit = resumeAction === "edit";
  // const [editingInput, setEditingInput] = useState(canEdit);

  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const getDescendantDraft = store((state) => state.getDescendantDraft);
  const updateDescendantDraft = store((state) => state.updateDescendantDraft);
  const commitDescendantDraft = store((state) => state.commitDescendantDraft);

  const getItemDraft = (): ItemDataType<ItemClientStateType> => {
    console.log(`DescendantInput:getItemDraft(): ancestorClientIdChain=${JSON.stringify(ancestorClientIdChain)}`);
    return getDescendantDraft(ancestorClientIdChain);
  };

  const updateItemDraft = (descendantData: ItemDataUntypedType): void => {
    console.log(
      `DescendantInput:updateItemDraft(descendantData=${descendantData}): ancestorClientIdChain=${JSON.stringify(
        ancestorClientIdChain,
      )}`,
    );
    updateDescendantDraft(descendantData, ancestorClientIdChain);
  };

  const commitItemDraft = (): void => {
    console.log(`DescendantInput:commitItemDraft(): ancestorClientIdChain=${JSON.stringify(ancestorClientIdChain)}`);
    commitDescendantDraft(ancestorClientIdChain);
  };

  const itemDraft = getItemDraft();
  return (
    <div key={item.clientId} className="flex gap-x-4 items-center">
      <div
        className={cn("sm:flex-shrink-0 w-48 my-2 text-right text-muted-foreground text-sm", {
          "font-medium text-xl my-4": ["user", "resume"].includes(itemModel),
        })}
      >
        Add new {itemModel}
        {ancestorClientIdChain.length > 0 ? (
          <>
            {" "}
            below <pre>{`${ancestorClientIdChain.map((id) => id.substring(0, 8)).join("\n")}`}</pre>
          </>
        ) : null}
      </div>
      <DescendantListItemInput
        itemModel={itemModel}
        itemDraft={itemDraft}
        updateItemDraft={updateItemDraft}
        commitItemDraft={commitItemDraft}
        // editingInput={editingInput}
        // setEditingInput={setEditingInput}
        canEdit={canEdit}
      />
    </div>
  );
}
