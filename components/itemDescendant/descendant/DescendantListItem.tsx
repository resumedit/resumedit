// @/component/itemDescendant/ItemDescendantListItem.tsx

import { cn } from "@/lib/utils";
import { DateTimeFormat, DateTimeSeparator, dateToISOLocal } from "@/lib/utils/formatDate";
import { getItemSchema, getSchemaFields } from "@/lib/utils/itemDescendantListUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";

import { ItemClientStateType, ItemDataUntypedType } from "@/schemas/item";
import { ItemDescendantClientStateType } from "@/schemas/itemDescendant";
import useAppSettingsStore from "@/stores/appSettings/useAppSettingsStore";
import { ClientIdType, ItemDisposition } from "@/types/item";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { ResumeActionType } from "@/types/resume";
import { Grip } from "lucide-react";
import { InputProps } from "react-editext";
import EditableField from "../utils/EditableField";
import { ItemActionButton } from "../utils/ItemActionButton";

export interface DescendantListItemProps {
  index: number;
  rootItemModel: ItemDescendantModelNameType;
  itemModel: ItemDescendantModelNameType;
  item: ItemDescendantClientStateType;
  resumeAction: ResumeActionType;
  setItemData: (data: ItemDataUntypedType, clientId: string) => void;
  markItemAsDeleted: (clientId: ClientIdType) => void;
  itemIsDragable: boolean;
  canEdit: boolean;
}

export default function DescendantListItem({
  canEdit,
  resumeAction = "view",
  itemIsDragable,
  index,
  itemModel,
  item,
  setItemData,
  markItemAsDeleted,
}: DescendantListItemProps) {
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

  const settingsStore = useAppSettingsStore();
  const { showItemDescendantInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showItemDescendantInternals;

  // Construct the URL to edit this item
  const pathname = usePathname();
  // FIXME: Moved into <ItemActionButton />
  // const getItemActionURL = (action: ResumeActionType) =>
  //   `${pathname.replace(rootItemModel, itemModel)}/${item.id}/${action}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (val: any, inputProps?: InputProps) => {
    if (inputProps?.name) {
      setItemData({ [inputProps.name]: val } as ItemDataUntypedType, item.clientId);
    } else {
      window.consoleLog(
        `ItemDescendantListItem: missing field name in handleSave(value=`,
        val,
        `, inputProps=`,
        inputProps,
        `)`,
      );
    }
  };

  return item.deletedAt ? null : (
    <div
      key={item.clientId}
      className={cn(
        "border-shadow-light dark:border-dark-txt-1 bg-elem-light dark:bg-elem-dark-1 group flex flex-1 cursor-auto items-center justify-between rounded-md border-b",
        {
          "bg-background/50 text-muted-foreground bg-blend-soft-light": item.disposition !== ItemDisposition.Synced,
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
        {itemFormFields.map((field, index) => (
          <div
            key={index}
            className="text-shadow-dark dark:text-light-txt-1 text-dark-txt-1 dark:text-light-txt-4 flex-1"
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
