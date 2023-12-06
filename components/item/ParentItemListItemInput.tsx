// @/components/item/ParentItemListItemInput.tsx
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { cn } from "@/lib/utils";
import { getItemSchemaBasedOnStoreName, getSchemaFields } from "@/lib/utils/parentItemListUtils";
import { ItemDataUntypedFieldNameType } from "@/types/item";
import { Dispatch, SetStateAction, useState } from "react";
import { InputProps } from "react-editext";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import EditableInputField from "./utils/EditableInputField";

interface ParentItemListItemInputProps {
  editingInput: boolean;
  setEditingInput: Dispatch<SetStateAction<boolean>>;
}

const ParentItemListItemInput = ({ editingInput /*, setEditingInput */ }: ParentItemListItemInputProps) => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const itemDraft = store((state) => state.itemDraft);
  const updateItemDraft = store((state) => state.updateItemDraft);
  const commitItemDraft = store((state) => state.commitItemDraft);

  const itemSchema = getItemSchemaBasedOnStoreName(storeName);
  const itemFields = getSchemaFields(itemSchema);

  const [inputIsValid, setInputIsValid] = useState(false);

  // Use a single state object to manage all fields
  // const [fieldValues, setFieldValues] = useState(() => {
  //   const initialValues = {} as Record<string, any>;
  //   itemFields.forEach((fieldName) => {
  //     initialValues[fieldName] = itemDraft[fieldName];
  //   });
  //   return initialValues;
  // });

  // Initialize local state for field values
  const [fieldValues, setFieldValues] = useState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemFields.reduce((acc, field) => ({ ...acc, [field]: "" }), {} as Record<string, any>),
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    if (event.target.name) {
      const fieldName = event.target.name as ItemDataUntypedFieldNameType;
      const newValue = event.target.value;

      setFieldValues((prev) => ({ ...prev, [fieldName]: newValue }));
      updateItemDraft({ ...itemDraft, [fieldName]: newValue });
    }

    const validationStatus = itemSchema.safeParse({ ...itemDraft });
    setInputIsValid(validationStatus.success);
  };

  const handleSave = (value?: string, inputProps?: InputProps) => {
    if (inputProps?.name) {
      // Update the item draft in the store
      const fieldName = inputProps.name as ItemDataUntypedFieldNameType;
      // updateItemDraft({ ...itemDraft, [fieldName]: value });
      // Update the local state
      setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
      // Update the Zustand store
      updateItemDraft({ ...fieldValues, [fieldName]: value });
    }
    return commitToStore();
  };

  const commitToStore = (): boolean => {
    // Perform validation before committing
    const validationStatus = itemSchema.safeParse({ ...itemDraft });
    setInputIsValid(validationStatus.success);
    if (validationStatus.success) {
      commitItemDraft();
      // Reset field values after commit
      setFieldValues(itemFields.reduce((acc, field) => ({ ...acc, [field]: "" }), {}));
      setInputIsValid(false);
    } else {
      console.log(`handleSubmit: Validation failed. itemDraft:`, itemDraft, `validationStatus:`, validationStatus);
      toast({ title: `Validation failed`, description: JSON.stringify(validationStatus) });
    }
    return validationStatus.success;
  };

  const handleSubmitButton = () => {
    commitToStore();
  };

  // const handleFocus = (event: React.MouseEvent<HTMLDivElement>) => {
  //   console.log(`handleFocus: setEditingInput from ${editingInput} -> true with event[${typeof event}]:`, event);
  //   setEditingInput(true);
  // };

  // const handleBlur = (event: React.MouseEvent<HTMLDivElement>) => {
  //   console.log(`handleFocus: setEditingInput from ${editingInput} -> false with event[${typeof event}]:`, event);
  //   setEditingInput(false);
  // };

  return (
    <div className="my-2  px-4 flex flex-col gap-y-2">
      <div className="flex gap-x-2">
        <div className="flex-1 flex flex-col gap-y-2" /* onMouseEnter={handleFocus} onMouseLeave={handleBlur} */>
          {itemFields.map((fieldName) => (
            <EditableInputField
              key={fieldName}
              fieldName={fieldName}
              value={fieldValues[fieldName]}
              placeholder={`Type ${fieldName}`}
              onChange={handleChange}
              onSave={handleSave}
              editing={editingInput}
            />
          ))}
        </div>
        <Button disabled={!inputIsValid} onClick={handleSubmitButton}>{`Create ${storeName}`}</Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <div className={cn("my-2", { "bg-muted-foreground": editingInput })}>
          <span>itermDraft=</span>
          <code>{JSON.stringify(itemDraft)}</code>
        </div>
      )}
    </div>
  );
};

export default ParentItemListItemInput;
