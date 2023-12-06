// @/components/itemDescendant/utils/ItemDescendantFilteredLists.tsx

import { ItemDescendantRenderProps } from "../ItemDescendantList.client";
import Descendant from "../descendant/Descendant";
import SortableWrapper from "./ItemDescendantSortableWrapper";

export default function ItemDescendantFilteredLists(props: ItemDescendantRenderProps) {
  const { item } = props;
  const descendants = item.descendants;
  return (
    <SortableWrapper items={descendants}>
      {descendants.map((descendant, index) => {
        return <Descendant {...props} index={index} key={descendant.clientId} item={descendant} />;
      })}
    </SortableWrapper>
  );
}
