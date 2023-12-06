// @/components/itemDescendant/ItemDescendantItem.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { cn } from "@/lib/utils";
import { DateTimeFormat, DateTimeSeparator, dateToISOLocal } from "@/lib/utils/formatDate";
import { getItemSchema, getSchemaFields, isNumberField } from "@/lib/utils/itemDescendantListUtils";
import useAppSettingsStore from "@/stores/appSettings/useAppSettingsStore";
import { ItemDescendantClientStateType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemClientStateType, ItemDataUntypedFieldNameType, ItemDisposition } from "@/types/item";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { InputProps } from "react-editext";
import { useForm } from "react-hook-form";
import { ItemDescendantRenderProps } from "./ItemDescendantList.client";
import EditableFieldPersist from "./utils/EditableFieldPersist";

export interface ItemProps extends ItemDescendantRenderProps {
  rootItemModel: ItemDescendantModelNameType;
  itemModel: ItemDescendantModelNameType;
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>;
}
export default function Item(props: ItemProps) {
  const { item, index, resumeAction } = props;
  // const [editingInput, setEditingInput] = useState(resumeAction === "edit");
  const storeName = useStoreName();
  const store = useItemDescendantStore(storeName);
  const setItemData = store((state) => state.setItemData);
  const markItemAsDeleted = store((state) => state.markItemAsDeleted);

  const itemModel = item.itemModel;

  const canEdit = itemModel === "user" ? false : resumeAction === "edit";

  const itemFormSchema = getItemSchema(itemModel, "form");
  const itemFormFields = getSchemaFields(itemModel, "display");
  const {
    // register,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemFormSchema),
  });

  // Convert array to union type
  type ItemFormFieldKeys = (typeof itemFormFields)[number];

  // Define updatedKeyValue type
  type FormKeyValueType = {
    key: ItemFormFieldKeys;
    value: string | number;
  };

  const settingsStore = useAppSettingsStore();
  const { showItemDescendantInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showItemDescendantInternals;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [inputIsValid, setInputIsValid] = useState(true);

  // Initialize local state for field values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fieldValues, setFieldValues] = useState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemFormFields.reduce((acc, field) => ({ ...acc, [field]: "" }), {} as Record<string, any>),
  );

  const updateValidationStatus = () => {
    const validationStatus = itemFormSchema.safeParse({ ...item });
    setInputIsValid(validationStatus.success);
    return validationStatus;
  };

  function extractFieldName(input: string): ItemDataUntypedFieldNameType {
    const parts = input.split("-");
    return parts[parts.length - 1];
  }

  function getUpdatedKeyValueFromEvent(
    event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ): FormKeyValueType | undefined {
    if (event && event.target?.name) {
      const updatedKeyValue = {
        key: extractFieldName(event.target.name),
        value: event.target.value,
      };
      return updatedKeyValue;
    }
  }

  function getUpdatedKeyValueFromEdiTextField(value?: string, inputProps?: InputProps): FormKeyValueType | undefined {
    if (value && inputProps?.name) {
      const updatedKeyValue = {
        key: extractFieldName(inputProps.name),
        value,
      };
      return updatedKeyValue;
    }
  }

  function handleUpdatedKeyValue(updatedKeyValue: FormKeyValueType | undefined) {
    if (typeof updatedKeyValue === "undefined") return;
    // Check if the field is a number and parse it
    if (isNumberField(itemFormSchema, updatedKeyValue.key)) {
      if (typeof updatedKeyValue.value !== "number") {
        // Default to 0 if parsing fails
        updatedKeyValue = { ...updatedKeyValue, value: parseFloat(updatedKeyValue.value) || 0 };
      }
    }

    setFieldValues((prev) => ({ ...prev, ...updatedKeyValue }));
    updateValidationStatus();
    return updatedKeyValue;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    // updateItemDraft({ ...itemDraft, [fieldName]: newValue });
    const update = handleUpdatedKeyValue(getUpdatedKeyValueFromEvent(event));
    if (update !== undefined) {
      // Update the Zustand store
      setItemData({ [update.key]: update.value }, item.clientId);
    }
  };

  const handleSave = (value?: string, inputProps?: InputProps) => {
    const update = handleUpdatedKeyValue(getUpdatedKeyValueFromEdiTextField(value, inputProps));
    if (update) {
      // Update the Zustand store
      setItemData({ [update.key]: update.value }, item.clientId);
    }
  };

  return (
    <div className="flex-1 flex justify-between">
      <div
        className={cn("flex-1 flex gap-x-4 gap-y-2 justify-between outline outline-offset-2 ", {
          "text-muted-foreground bg-blend-soft-light bg-background/50": item.disposition !== ItemDisposition.Synced,
          "outline-red-500": !inputIsValid,
          "outline-none": inputIsValid,
        })}
      >
        {itemFormFields.map((field, index) => (
          <div
            key={index}
            className="flex-1 text-shadow-dark dark:text-light-txt-1 text-dark-txt-1 dark:text-light-txt-4"
          >
            <EditableFieldPersist
              key={field}
              fieldName={field}
              placeholder={`${field} for ${itemModel}`}
              value={item[field as keyof ItemClientStateType] as string}
              onSave={handleSave}
              onChange={handleChange}
              canEdit={canEdit}
            />
          </div>
        ))}
        {/* TODO: Handle and display errors from formState.errors */}
      </div>
      {showListItemInternals && (
        <div className="basis-3/4 flex items-center gap-x-4 px-4 py-2 cursor-auto text-xs text-slate-600">
          <p className="h-full flex items-center px-2 text-lg bg-slate-200">{index}</p>
          <table>
            <tbody>
              <tr>
                <td className="py-0">{item.disposition}</td>
              </tr>
            </tbody>
          </table>
          <table className="w-auto">
            <tbody>
              <tr>
                <td
                  className={cn("py-0", {
                    "text-red-500": item.disposition !== ItemDisposition.Synced,
                  })}
                >
                  <span className="text-xs text-muted-foreground">modified</span>:&nbsp;
                  <span className="py-0">
                    {dateToISOLocal(item.lastModified, DateTimeFormat.MonthDayTime, DateTimeSeparator.Newline)}
                  </span>
                </td>
              </tr>
              <tr>
                <td className={"py-0"}>
                  <span className="text-xs text-muted-foreground">created</span>:&nbsp;
                  {dateToISOLocal(item.createdAt, DateTimeFormat.MonthDayTime, DateTimeSeparator.Newline)}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="w-auto">
            <tbody>
              <tr>
                <td className="py-0">
                  <span className="text-xs text-muted-foreground">client</span>&nbsp;
                  <code>{item.clientId?.substring(0, 8)}&hellip;</code>
                </td>
              </tr>
              <tr>
                <td className="py-0">
                  <span className="text-xs text-muted-foreground">server</span>&nbsp;
                  <code>{item.id?.substring(0, 8)}&hellip;</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {canEdit && itemModel !== "user" ? (
        <button
          /* /Delete Button */
          className="px-4 self-stretch text-light-txt-2 dark:text-light-txt-1 opacity-100 md:group-hover:opacity-100 transition-all duration-150"
          title={`Delete ${itemModel}`}
          onClick={() => markItemAsDeleted(item.clientId)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
