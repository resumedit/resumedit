// @/components/item/ParentItemSortableWrapper.tsx

import { ItemClientStateType } from "@/types/item";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ReactNode } from "react";

interface ParentItemSortableWrapperProps {
  items: ItemClientStateType[];
  children: ReactNode;
  disabled?: boolean;
}

// Single Instance of Sortable Context - Pass around
const ParentItemSortableWrapper = ({ items, children, disabled }: ParentItemSortableWrapperProps) => {
  // In the instantiation of the `<SortableContext` component, it is crucial that
  // the `items` property is a list with the unique identifiers. By default, the
  // field `id` is used
  // See: https://github.com/clauderic/dnd-kit/issues/807 for how to use a field
  // that is named other than `id`
  return (
    <SortableContext items={items.map((i) => i.clientId)} strategy={verticalListSortingStrategy} disabled={disabled}>
      {children}
    </SortableContext>
  );
};

export default ParentItemSortableWrapper;
