// @/components/nestedItem/NestedItemSortableWrapper.tsx

import { NestedItemStoreDescendantListType } from "@/stores/nestedItemStore/createNestedItemStore";
import { NestedItemDescendantClientStateType } from "@/types/nestedItem";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ReactNode } from "react";

interface NestedItemSortableWrapperProps {
  items: NestedItemStoreDescendantListType<NestedItemDescendantClientStateType, NestedItemDescendantClientStateType>;
  disabled?: boolean;
  children: ReactNode;
}

// Single Instance of Sortable Context - Pass around
const NestedItemSortableWrapper = ({ children, items, disabled }: NestedItemSortableWrapperProps) => {
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

export default NestedItemSortableWrapper;
