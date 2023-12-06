// @/components/nestedItemRecursive/NestedItemRecursiveListStoreState.tsx

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNestedItemRecursiveStore } from "@/contexts/NestedItemRecursiveStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { NestedItemListType, NestedItemModelAccessor, NestedItemServerToClientType } from "@/types/nestedItem";

interface NestedItemRecursiveStoreStateProps {
  storeName: keyof NestedItemModelAccessor;
  serverState: NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType>;
}

export default function NestedItemRecursiveListStoreState(props: NestedItemRecursiveStoreStateProps) {
  const storeName = useStoreName();
  const store = useNestedItemRecursiveStore(storeName);
  const rootState = store((state) => state);
  const itemModel = store((state) => state.itemModel);
  const descendants = store((state) => state.descendants);
  const lastModified = store((state) => state.lastModified);

  return !props.serverState ? null : (
    <Table>
      <TableCaption>
        NestedItemRecursiveStore <code>{storeName}</code>
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>storeName</TableHead>
          <TableHead>itemModel</TableHead>
          <TableHead>item</TableHead>
          <TableHead>item.lastModified</TableHead>
          <TableHead>descendants</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow key="props">
          <TableCell>Props</TableCell>
          <TableCell>{props.storeName}</TableCell>
          <TableCell>{props.serverState.itemModel}</TableCell>
          <TableCell className="text-xs">
            <pre>{JSON.stringify(props.serverState, undefined, 2)}</pre>
          </TableCell>
          <TableCell>{dateToISOLocal(props.serverState.lastModified).replace("T", "\n")}</TableCell>
          <TableCell className="text-xs">
            <pre>{JSON.stringify(descendants, undefined, 2)}</pre>
          </TableCell>
        </TableRow>
        <TableRow key="store">
          <TableCell>Store</TableCell>
          <TableCell>{itemModel}</TableCell>
          <TableCell className="text-xs">
            <pre>{JSON.stringify(rootState, undefined, 2)}</pre>
          </TableCell>
          <TableCell>{dateToISOLocal(lastModified).replace("T", "\n")}</TableCell>
          <TableCell className="text-xs">
            <pre>{JSON.stringify(descendants, undefined, 2)}</pre>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
