// @/components/nestedItemRecursive/NestedItemRecursiveListItemInput.tsx

import { cn } from "@/lib/utils";
import { getItemSchema, getSchemaFields, isNumberField } from "@/lib/utils/nestedItemListUtils";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { ItemDataUntypedFieldNameType } from "@/types/item";
import {
  NestedItemDescendantClientStateType,
  NestedItemDescendantDataType,
  NestedItemDescendantDataUntypedType,
  NestedItemStoreNameType,
} from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import { Plus } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { InputProps } from "react-editext";
import EditableInputField from "../nestedItem/utils/EditableInputField";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

interface NestedItemRecursiveListItemInputProps {
  resumeAction: ResumeActionType;
  editingInput: boolean;
  setEditingInput: Dispatch<SetStateAction<boolean>>;
  itemModel: NestedItemStoreNameType;
  itemDraft: NestedItemDescendantDataType<NestedItemDescendantClientStateType>;
  updateItemDraft: (itemData: NestedItemDescendantDataUntypedType) => void;
  commitItemDraft: () => void;
}

export default function NestedItemRecursiveListItemInput({
  // resumeAction,
  editingInput /* setEditingInput, */,
  itemModel: itemModel,
  itemDraft: itemDraft,
  updateItemDraft,
  commitItemDraft,
}: NestedItemRecursiveListItemInputProps) {
  const descendantFormSchema = getItemSchema(itemModel, "form");
  const descendantFormFields = getSchemaFields(itemModel, "display");

  const [inputIsValid, setInputIsValid] = useState(false);

  const settingsStore = useSettingsStore();
  const { showNestedItemInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showNestedItemInternals;

  // Initialize local state for field values
  const [fieldValues, setFieldValues] = useState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descendantFormFields.reduce((acc, field) => ({ ...acc, [field]: "" }), {} as Record<string, any>),
  );

  const validate = (descendantDraft: object) => {
    const validationStatus = descendantFormSchema.safeParse({ ...descendantDraft });
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
      if (isNumberField(descendantFormSchema, fieldName)) {
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
      if (isNumberField(descendantFormSchema, fieldName)) {
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
      setFieldValues(descendantFormFields.reduce((acc, field) => ({ ...acc, [field]: "" }), {}));
      setInputIsValid(false);
    } else {
      console.log(
        `handleSubmit: Validation failed. descendantDraft:`,
        itemDraft,
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
          {descendantFormFields.map((fieldName) => (
            <EditableInputField
              key={fieldName}
              fieldName={`${itemModel}-${fieldName}`}
              value={fieldValues[fieldName]}
              placeholder={`${fieldName}`}
              onChange={handleChange}
              onSave={handleSave}
              editing={editingInput}
              className="flex-1"
            />
          ))}
        </div>
        <Button variant="ghost" disabled={!inputIsValid} onClick={handleSubmitButton} title={`Create ${itemModel}`}>
          {<Plus />}
        </Button>
      </div>
      {showListItemInternals && (
        <div className={cn("my-2", { "bg-muted-foreground": editingInput })}>
          <span>itermDraft=</span>
          <code>{JSON.stringify(itemDraft)}</code>
        </div>
      )}
    </div>
  );
}
