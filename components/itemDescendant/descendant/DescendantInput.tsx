// @/components/itemDescendant/descendant/DescendantInput.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
// import { useState } from "react";
import { cn } from "@/lib/utils";
import { ItemClientStateType, ItemDataType, ItemDataUntypedType } from "@/schemas/item";
import { useState } from "react";
import { ItemDescendantRenderProps } from "../ItemDescendantList.client";
import DescendantListItemInput from "./DescendantListItemInput";

export default function DescendantInput(props: ItemDescendantRenderProps) {
  const { ancestorClientIdChain, item, itemModel, resumeAction } = props;
  const canEdit = resumeAction === "edit";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingInput, setEditingInput] = useState(canEdit);

  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const getDescendantDraft = store((state) => state.getDescendantDraft);
  const updateDescendantDraft = store((state) => state.updateDescendantDraft);
  const commitDescendantDraft = store((state) => state.commitDescendantDraft);

  const getItemDraft = (): ItemDataType<ItemClientStateType> => {
    // window.consoleLog(`DescendantInput:getItemDraft(): ancestorClientIdChain=${JSON.stringify(ancestorClientIdChain)}`);
    return getDescendantDraft(ancestorClientIdChain);
  };

  const updateItemDraft = (descendantData: ItemDataUntypedType): void => {
    // window.consoleLog(`DescendantInput:updateItemDraft(descendantData=${descendantData}): ancestorClientIdChain=${JSON.stringify(ancestorClientIdChain)}`);
    updateDescendantDraft(descendantData, ancestorClientIdChain);
  };

  const commitItemDraft = (): void => {
    // window.consoleLog(`DescendantInput:commitItemDraft(): ancestorClientIdChain=${JSON.stringify(ancestorClientIdChain)}`,);
    commitDescendantDraft(ancestorClientIdChain);
  };

  const itemDraft = getItemDraft();

  return (
    <div key={item.clientId} className="flex items-center gap-x-4">
      <div
        className={cn("my-2 w-48 text-right text-sm text-muted-foreground sm:flex-shrink-0", {
          "my-4 text-xl font-medium": ["user", "resume"].includes(itemModel),
        })}
      >
        Add new {itemModel}
        {ancestorClientIdChain.length > 0 ? (
          <>
            {" "}
            below{" "}
            <pre>{`${ancestorClientIdChain
              .toReversed()
              .map((id) => id.substring(0, 8))
              .join("\n")}`}</pre>
          </>
        ) : null}
      </div>
      <DescendantListItemInput
        itemModel={itemModel}
        itemDraft={itemDraft}
        updateItemDraft={updateItemDraft}
        commitItemDraft={commitItemDraft}
        editingInput={editingInput}
        // setEditingInput={setEditingInput}
        canEdit={canEdit}
      />
    </div>
  );
}
