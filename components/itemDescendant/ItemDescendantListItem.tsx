// @/component/itemDescendant/ItemDescendantListItem.tsx

import { cn } from "@/lib/utils";
import { DateTimeFormat, DateTimeSeparator, dateToISOLocal } from "@/lib/utils/formatDate";
import { getItemSchema, getSchemaFields } from "@/lib/utils/itemDescendantListUtils";
import { IdSchemaType } from "@/schemas/id";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ItemDescendantClientStateType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { ItemClientStateType, ItemDataUntypedType, ItemDisposition } from "@/types/item";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { ResumeItemClientStateType } from "@/types/resume";
import { Edit, Grip } from "lucide-react";
import Link from "next/link";
import { InputProps } from "react-editext";
import { Button } from "../ui/button";
import EditableField from "./utils/EditableField";

export interface ItemDescendantListItemProps {
  index: number;
  itemModel: ItemDescendantModelNameType;
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>;
  setItemData: (data: ItemDataUntypedType, clientId: string) => void;
  markItemAsDeleted: (clientId: IdSchemaType) => void;
  itemIsDragable: boolean;
  canEdit: boolean;
}

export default function ItemDescendantListItem({
  canEdit,
  itemIsDragable,
  index,
  itemModel,
  item: item,
  setItemData,
  markItemAsDeleted,
}: ItemDescendantListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.clientId,
  });
  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const itemFormSchema = getItemSchema(itemModel, "form");
  const itemFormFields = getSchemaFields(itemModel, "display");
  const {
    // register,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemFormSchema),
  });

  const settingsStore = useSettingsStore();
  const { showItemDescendantInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showItemDescendantInternals;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (val: any, inputProps?: InputProps) => {
    if (inputProps?.name) {
      setItemData({ [inputProps.name]: val } as ItemDataUntypedType, item.clientId);
    } else {
      console.log(
        `ItemDescendantListItem: missing field name in handleSave(value=`,
        val,
        `, inputProps=`,
        inputProps,
        `)`,
      );
    }
  };

  return item.deletedAt ? null : (
    <li
      className="flex justify-between border-b border-shadow-light dark:border-dark-txt-1 bg-elem-light dark:bg-elem-dark-1"
      ref={setNodeRef}
      style={styles}
      {...attributes}
    >
      <div
        className={cn("flex-1 flex items-center group cursor-auto rounded-md", {
          "text-muted-foreground bg-blend-soft-light bg-background/50": item.disposition !== ItemDisposition.Synced,
          "basis-1/4": showListItemInternals,
        })}
      >
        {canEdit && itemModel === "resume" && item.id !== undefined ? (
          <div className="h-full">
            <Link
              title={`Edit resume ${(item as unknown as ResumeItemClientStateType).name}`}
              href={`/resume/${item.id}/edit`}
            >
              <Button variant={"ghost"} className="h-full">
                {<Edit />}
              </Button>
            </Link>
          </div>
        ) : null}
        {canEdit && itemIsDragable ? (
          <div
            className={cn("h-full flex items-center", {
              "hover:cursor-grab active:cursor-grabbing": itemIsDragable,
            })}
            {...listeners}
          >
            <Grip />
          </div>
        ) : null}
        <div className="w-full flex-1 flex gap-x-4 gap-y-2 justify-between">
          {itemFormFields.map((field, index) => (
            <div
              key={index}
              className="w-full text-shadow-dark dark:text-light-txt-1 text-dark-txt-1 dark:text-light-txt-4"
            >
              <EditableField
                key={field}
                fieldName={field}
                value={item[field as keyof ItemClientStateType] as string}
                onSave={handleSave}
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
          <div className="flex items-center h-full group">
            {/* /Delete Button */}
            <button
              className="h-full basis-1/12 px-4 flex place-name-center items-center text-light-txt-2 dark:text-light-txt-1 opacity-100 md:group-hover:opacity-100 transition-all duration-150"
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
          </div>
        ) : null}
      </div>
    </li>
  );
}
