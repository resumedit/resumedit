// @/components/nestedItem/NestedItemListItemInput.tsx
import { useNestedItemStore } from "@/contexts/NestedItemStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { cn } from "@/lib/utils";
import { getItemSchema, getSchemaFields, isNumberField } from "@/lib/utils/nestedItemListUtils";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { ItemDataUntypedFieldNameType } from "@/types/item";
import { Plus } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { InputProps } from "react-editext";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import EditableInputField from "./utils/EditableInputField";

interface NestedItemListItemInputProps {
  editingInput: boolean;
  setEditingInput: Dispatch<SetStateAction<boolean>>;
}

export default function ItemListItemInput({ editingInput /*, setEditingInput */ }: NestedItemListItemInputProps) {
  const storeName = useStoreName();
  const store = useNestedItemStore(storeName);
  const descendantDraft = store((state) => state.descendantDraft);
  const updateDescendantDraft = store((state) => state.updateDescendantDraft);
  const commitDescendantDraft = store((state) => state.commitDescendantDraft);

  const itemFormSchema = getItemSchema(storeName, "form");
  const itemFields = getSchemaFields(storeName, "display");

  const [inputIsValid, setInputIsValid] = useState(false);

  const settingsStore = useSettingsStore();
  const { showNestedItemInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showNestedItemInternals;

  // Initialize local state for field values
  const [fieldValues, setFieldValues] = useState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemFields.reduce((acc, field) => ({ ...acc, [field]: "" }), {} as Record<string, any>),
  );

  const validate = (descendantDraft: object) => {
    const validationStatus = itemFormSchema.safeParse({ ...descendantDraft });
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
      if (isNumberField(itemFormSchema, fieldName)) {
        newValue = parseFloat(newValue) || 0; // Default to 0 if parsing fails
      }

      setFieldValues((prev) => ({ ...prev, [fieldName]: newValue }));
      updateDescendantDraft({ ...descendantDraft, [fieldName]: newValue });
    }

    const validationStatus = validate({ ...descendantDraft });
    setInputIsValid(validationStatus.success);
  };

  const handleSave = (value?: string, inputProps?: InputProps) => {
    if (value && inputProps?.name) {
      // Update the item draft in the store
      const fieldName = extractFieldName(inputProps.name);

      let newValue: string | number = value;

      // Check if the field is a number and parse it
      if (isNumberField(itemFormSchema, fieldName)) {
        newValue = parseFloat(newValue) || 0; // Default to 0 if parsing fails
      }

      // Update the local state
      setFieldValues((prev) => ({ ...prev, [fieldName]: newValue }));
      // Update the Zustand store
      updateDescendantDraft({ ...fieldValues, [fieldName]: newValue });
    }
    return commitToStore();
  };

  const commitToStore = (): boolean => {
    // Perform validation before committing
    const validationStatus = validate({ ...descendantDraft });
    setInputIsValid(validationStatus.success);
    if (validationStatus.success) {
      commitDescendantDraft();
      // Reset field values after commit
      setFieldValues(itemFields.reduce((acc, field) => ({ ...acc, [field]: "" }), {}));
      setInputIsValid(false);
    } else {
      console.log(
        `handleSubmit: Validation failed. descendantDraft:`,
        descendantDraft,
        `validationStatus:`,
        validationStatus,
      );
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
        <div className="flex-1 flex gap-y-2" /* onMouseEnter={handleFocus} onMouseLeave={handleBlur} */>
          {itemFields.map((fieldName) => (
            <EditableInputField
              key={fieldName}
              fieldName={`${storeName}-${fieldName}`}
              value={fieldValues[fieldName]}
              placeholder={`${fieldName}`}
              onChange={handleChange}
              onSave={handleSave}
              editing={editingInput}
              className="flex-1"
            />
          ))}
        </div>
        <Button variant="ghost" disabled={!inputIsValid} onClick={handleSubmitButton} title={`Create ${storeName}`}>
          {<Plus />}
        </Button>
      </div>
      {showListItemInternals && (
        <div className={cn("my-2", { "bg-muted-foreground": editingInput })}>
          <span>itermDraft=</span>
          <code>{JSON.stringify(descendantDraft)}</code>
        </div>
      )}
    </div>
  );
}
