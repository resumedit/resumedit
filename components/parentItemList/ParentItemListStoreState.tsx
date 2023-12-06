// @/components/item/ParentItemListStoreState.tsx

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { ItemServerToClientType } from "@/types/item";
import { ParentItemListType, ParentItemModelAccessor } from "@/types/parentItemList";

interface ParentItemListStoreStateProps {
  storeName: keyof ParentItemModelAccessor;
  serverState: ParentItemListType<ItemServerToClientType, ItemServerToClientType>;
}

const ParentItemListStoreState = (props: ParentItemListStoreStateProps) => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const parentModel = store((state) => state.parentModel);
  const itemModel = store((state) => state.itemModel);
  const parent = store((state) => state.parent);

  return !props.serverState ? null : (
    <Table>
      <TableCaption>
        ParentItemListStore <code>{storeName}</code>
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>itemModel</TableHead>
          <TableHead>parentModel</TableHead>
          <TableHead>parent</TableHead>
          <TableHead>parent.lastModified</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow key="props">
          <TableCell>Props</TableCell>
          <TableCell>{props.storeName}</TableCell>
          <TableCell>n/a</TableCell>
          <TableCell className="text-xs">
            <pre>{JSON.stringify(props.serverState.parent, undefined, 2)}</pre>
          </TableCell>
          <TableCell>{dateToISOLocal(props.serverState.parent.lastModified).replace("T", "\n")}</TableCell>
        </TableRow>
        <TableRow key="store">
          <TableCell>Store</TableCell>
          <TableCell>{itemModel}</TableCell>
          <TableCell>{parentModel}</TableCell>
          <TableCell className="text-xs">
            <pre>{JSON.stringify(parent, undefined, 2)}</pre>
          </TableCell>
          <TableCell>{dateToISOLocal(parent?.lastModified).replace("T", "\n")}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default ParentItemListStoreState;
