// @/components/item/ParentItemListStoreState.tsx

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { dateToISOLocal } from "@/lib/utils/formatDate";
import { IdSchemaType } from "@/schemas/id";
import { ParentItemModelAccessor } from "@/types/parentItemList";
import { ModificationTimestampType } from "@/types/timestamp";

interface Props {
  storeName: keyof ParentItemModelAccessor;
  parentId: IdSchemaType;
  serverModified: ModificationTimestampType;
}

const ParentItemListStoreState = (props: Props) => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const parentModel = store((state) => state.parentModel);
  const itemModel = store((state) => state.itemModel);
  const parentId = store((state) => state.parentId);
  const lastModified = store((state) => state.lastModified);

  return !props.parentId ? null : (
    <Table>
      <TableCaption>
        ParentItemListStore <code>{storeName}</code>
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>storeName|itemModel</TableHead>
          <TableHead>parentModel</TableHead>
          <TableHead>parentId</TableHead>
          <TableHead>lastModified</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow key="props">
          <TableCell>Props</TableCell>
          <TableCell>{props.storeName}</TableCell>
          <TableCell>n/a</TableCell>
          <TableCell>{props.parentId}</TableCell>
          <TableCell>{dateToISOLocal(props.serverModified).replace("T", "\n")}</TableCell>
        </TableRow>
        <TableRow key="store">
          <TableCell>Store</TableCell>
          <TableCell>{itemModel}</TableCell>
          <TableCell>{parentModel}</TableCell>
          <TableCell>{parentId}</TableCell>
          <TableCell>{dateToISOLocal(lastModified || 0).replace("T", "\n")}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default ParentItemListStoreState;
