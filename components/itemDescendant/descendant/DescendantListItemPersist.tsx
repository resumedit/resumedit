// @/component/itemDescendant/ItemDescendantListItem.tsx

import { cn } from "@/lib/utils";
import { DateTimeFormat, DateTimeSeparator, dateToISOLocal } from "@/lib/utils/formatDate";
import {
  getItemSchema,
  getSchemaFields,
  getUpdateFromEdiTextField,
  getUpdateFromEvent,
} from "@/lib/utils/itemDescendantListUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";

import { ItemClientStateType, ItemDataUntypedType } from "@/schemas/item";
import useAppSettingsStore from "@/stores/appSettings/useAppSettingsStore";
import { ClientIdType, ItemDisposition } from "@/types/item";
import { Grip } from "lucide-react";
import { useState } from "react";
import { InputProps } from "react-editext";
import { ItemDescendantRenderProps } from "../ItemDescendantList.client";
import EditableFieldPersist from "../utils/EditableFieldPersist";
import { ItemActionButton } from "../utils/ItemActionButton";

export interface DescendantListItemPersistProps extends ItemDescendantRenderProps {
  setItemData: (data: ItemDataUntypedType, clientId: string) => void;
  markItemAsDeleted: (clientId: ClientIdType) => void;
  itemIsDragable: boolean;
  canEdit: boolean;
}
export default function DescendantListItemPersist({
  resumeAction = "view",
  index,
  itemModel,
  item,
  setItemData,
  markItemAsDeleted,
  itemIsDragable,
  canEdit,
}: DescendantListItemPersistProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.clientId,
  });
  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Construct the URL to edit this item
  const pathname = usePathname();

  const settingsStore = useAppSettingsStore();
  const { showItemDescendantInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showItemDescendantInternals;

  const itemFormSchema = getItemSchema(itemModel, "form");
  const itemFormFields = getSchemaFields(itemModel, "display");
  const {
    // register,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemFormSchema),
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [inputIsValid, setInputIsValid] = useState(true);

  const updateValidationStatus = () => {
    const validationStatus = itemFormSchema.safeParse({ ...item });
    setInputIsValid(validationStatus.success);
    return validationStatus;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    // const update = handleUpdatedKeyValue(getUpdatedKeyValueFromEvent(event));
    const update = getUpdateFromEvent(itemFormSchema, event);
    if (update) {
      // Update the Zustand store
      setItemData(update, item.clientId);
      // Update form state
      updateValidationStatus();
    }
  };

  const handleSave = (value?: string, inputProps?: InputProps) => {
    // const update = handleUpdatedKeyValue(getUpdatedKeyValueFromEdiTextField(value, inputProps));
    const update = getUpdateFromEdiTextField(itemFormSchema, value, inputProps);
    if (update) {
      // Update the Zustand store
      setItemData(update, item.clientId);
      // Update form state
      updateValidationStatus();
    }
  };

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const handleSave = (val: any, inputProps?: InputProps) => {
  //   if (inputProps?.name) {
  //     setItemData({ [inputProps.name]: val } as ItemDataUntypedType, item.clientId);
  //   } else {
  //     window.consoleLog(
  //       `ItemDescendantListItemPersist: missing field name in handleSave(value=`,
  //       val,
  //       `, inputProps=`,
  //       inputProps,
  //       `)`,
  //     );
  //   }
  // };

  return item.deletedAt ? null : (
    <div
      key={item.clientId}
      className={cn(
        "border-shadow-light dark:border-dark-txt-1 bg-elem-light dark:bg-elem-dark-1 group flex flex-1 cursor-auto items-center justify-between rounded-md border-b",
        {
          "bg-background/50 text-muted-foreground bg-blend-soft-light": item.disposition !== ItemDisposition.Synced,
          "outline-red-500": !inputIsValid,
          "outline-none": inputIsValid,
          "basis-1/4": showListItemInternals,
        },
      )}
      ref={setNodeRef}
      style={styles}
      {...attributes}
    >
      {/* {canEdit && rootItemModel === "user" ? (
        <div className="h-full">
          <Link
            title={`Edit resume ${(item as unknown as ResumeItemClientStateType).name}`}
            href={getItemActionURL("edit")}
          >
            <Button variant={"ghost"} className="h-full">
              {<Edit />}
            </Button>
          </Link>
        </div>
      ) : null} */}
      {item.id && (itemModel === "resume" || pathname.startsWith("/item")) ? (
        <ItemActionButton pathname={pathname} item={item} action={resumeAction} />
      ) : null}
      {canEdit && itemIsDragable ? (
        <div
          className={cn("flex h-full items-center", {
            "hover:cursor-grab active:cursor-grabbing": itemIsDragable,
          })}
          {...listeners}
        >
          <Grip />
        </div>
      ) : null}
      <div className="flex flex-1 flex-wrap justify-between gap-x-4 gap-y-2">
        {itemFormFields.map((field) => (
          <div
            key={field}
            className="text-shadow-dark dark:text-light-txt-1 text-dark-txt-1 dark:text-light-txt-4 flex-1"
          >
            <EditableFieldPersist
              key={field}
              fieldName={field}
              value={item[field as keyof ItemClientStateType] as string}
              placeholder={`${field} for ${itemModel}`}
              onChange={handleChange}
              onSave={handleSave}
              canEdit={canEdit}
            />
          </div>
        ))}
        {/* TODO: Handle and display errors from formState.errors */}
      </div>
      {showListItemInternals && (
        <div className="flex basis-3/4 cursor-auto items-center gap-x-4 px-4 py-2 text-xs text-slate-600">
          <p className="flex h-full items-center bg-slate-200 px-2 text-lg">{index}</p>
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
          className="text-light-txt-2 dark:text-light-txt-1 self-stretch px-4 opacity-100 transition-all duration-150 md:group-hover:opacity-100"
          title={`Delete ${itemModel}`}
          onClick={() => markItemAsDeleted(item.clientId)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
