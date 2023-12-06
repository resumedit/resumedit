// @/components/item/ParentItemListItemInput.tsx
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { cn } from "@/lib/utils";
import { getItemSchemaBasedOnStoreName, getSchemaFields, isNumberField } from "@/lib/utils/parentItemListUtils";
import useSettingsStore from "@/stores/settings/useSettingsStore";
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

  const settingsStore = useSettingsStore();
  const { showParentItemListInternals } = settingsStore;
  const showInternals = process.env.NODE_ENV === "development" && showParentItemListInternals;

  // Initialize local state for field values
  const [fieldValues, setFieldValues] = useState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemFields.reduce((acc, field) => ({ ...acc, [field]: "" }), {} as Record<string, any>),
  );

  const validate = (itemDraft: object) => {
    const validationStatus = itemSchema.safeParse({ ...itemDraft });
    return validationStatus;
  };

  function extractFieldName(input: string): ItemDataUntypedFieldNameType {
    const parts = input.split("-");
    return parts[parts.length - 1];
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    if (event.target.name) {
      const fieldName = extractFieldName(event.target.name);
      let newValue: string | number = event.target.value;
      // Check if the field is a number and parse it
      if (isNumberField(itemSchema, fieldName)) {
        newValue = parseFloat(newValue) || 0; // Default to 0 if parsing fails
      }

      setFieldValues((prev) => ({ ...prev, [fieldName]: newValue }));
      updateItemDraft({ ...itemDraft, [fieldName]: newValue });
    }

    const validationStatus = validate({ ...itemDraft });
    setInputIsValid(validationStatus.success);
  };

  const handleSave = (value?: string, inputProps?: InputProps) => {
    if (value && inputProps?.name) {
      // Update the item draft in the store
      const fieldName = extractFieldName(inputProps.name);

      let newValue: string | number = value;

      // Check if the field is a number and parse it
      if (isNumberField(itemSchema, fieldName)) {
        newValue = parseFloat(newValue) || 0; // Default to 0 if parsing fails
      }

      // Update the local state
      setFieldValues((prev) => ({ ...prev, [fieldName]: newValue }));
      // Update the Zustand store
      updateItemDraft({ ...fieldValues, [fieldName]: newValue });
    }
    return commitToStore();
  };

  const commitToStore = (): boolean => {
    // Perform validation before committing
    const validationStatus = validate({ ...itemDraft });
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
              fieldName={`${storeName}-${fieldName}`}
              value={fieldValues[fieldName]}
              placeholder={`Type ${storeName} ${fieldName}`}
              onChange={handleChange}
              onSave={handleSave}
              editing={editingInput}
            />
          ))}
        </div>
        <Button disabled={!inputIsValid} onClick={handleSubmitButton}>{`Create ${storeName}`}</Button>
      </div>
      {showInternals && (
        <div className={cn("my-2", { "bg-muted-foreground": editingInput })}>
          <span>itermDraft=</span>
          <code>{JSON.stringify(itemDraft)}</code>
        </div>
      )}
    </div>
  );
};

export default ParentItemListItemInput;
