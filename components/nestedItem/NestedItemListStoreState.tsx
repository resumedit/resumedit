// @/components/nestedItem/NestedItemListStoreState.tsx

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { NestedItemListType, NestedItemModelAccessor, NestedItemServerToClientType } from "@/types/nestedItem";

interface NestedItemStoreStateProps {
  storeName: keyof NestedItemModelAccessor;
  serverState: NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType>;
}

const NestedItemStoreState = (props: NestedItemStoreStateProps) => {
  const storeName = useStoreName();
  const store = useNestedItemStore(storeName);
  const parentModel = store((state) => state.parentModel);
  const itemModel = store((state) => state.itemModel);
  const lastModified = store((state) => state.lastModified);

  return !props.serverState ? null : (
    <Table>
      <TableCaption>
        NestedItemStore <code>{storeName}</code>
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
            <pre>{JSON.stringify(props.serverState, undefined, 2)}</pre>
          </TableCell>
          <TableCell>{dateToISOLocal(props.serverState.lastModified).replace("T", "\n")}</TableCell>
        </TableRow>
        <TableRow key="store">
          <TableCell>Store</TableCell>
          <TableCell>{itemModel}</TableCell>
          <TableCell>{parentModel}</TableCell>
          <TableCell className="text-xs">
            <pre>{JSON.stringify(parent, undefined, 2)}</pre>
          </TableCell>
          <TableCell>{dateToISOLocal(lastModified).replace("T", "\n")}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default NestedItemStoreState;
