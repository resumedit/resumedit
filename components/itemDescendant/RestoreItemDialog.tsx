// @/components/itemDescendant/ItemDescendantItem.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemDescendantClientStateType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemClientStateType } from "@/types/item";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { ItemDescendantRenderProps } from "./ItemDescendantList.client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

import { formatRelative } from "date-fns";
import { useState } from "react";

export interface ItemProps extends ItemDescendantRenderProps {
  rootItemModel: ItemDescendantModelNameType;
  itemModel: ItemDescendantModelNameType;
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>;
}
export default function Item(props: ItemProps) {
  const { item } = props;
  // const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const restoreDeletedItem = store((state) => state.restoreDeletedItem);

  const [open, setOpen] = useState(!!item.deletedAt);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore resume?</DialogTitle>
          <DialogDescription>
            You can still restore the resume that was deleted {formatRelative(item.deletedAt!, new Date())}.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={() => restoreDeletedItem(item.clientId)}>Restore resume</Button>
      </DialogContent>
    </Dialog>
  );
}
