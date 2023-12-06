// @/components/item/ParentItemListItemInput.tsx
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { getItemSchemaBasedOnStoreName, getSchemaFields } from "@/lib/utils/parentItemListUtils";
import EditableField from "./utils/EditableField";
import { useStoreName } from "@/contexts/StoreNameContext";
import { ItemClientStateType } from "@/types/item";
import { InputProps } from "react-editext";

const ParentItemListItemInput = () => {
  const storeName = useStoreName();
  const itemSchema = getItemSchemaBasedOnStoreName(storeName);
  const itemFields = getSchemaFields(itemSchema);

  const store = useParentItemListStore(storeName);
  const addItem = store((state) => state.addItem);
  const parentId = store((state) => state.parentId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (val: any, inputProps?: InputProps) => {
    if (inputProps?.name) {
      const newItem = { [inputProps.name]: val, parentId };
      addItem(newItem as ItemClientStateType);
    }
  };

  return (
    <div className="flex flex-col gap-y-2">
      {itemFields.map((field) => (
        <EditableField key={field} fieldName={field} value={field} onSave={handleSave} />
      ))}
    </div>
  );
};

export default ParentItemListItemInput;
