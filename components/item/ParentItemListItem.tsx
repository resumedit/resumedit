// @/component/item/ParentItemListItem.tsx

import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { cn } from "@/lib/utils";
import { DateTimeFormat, DateTimeSeparator, dateToISOLocal } from "@/lib/utils/formatDate";
import { getItemSchemaBasedOnStoreName, getSchemaFields } from "@/lib/utils/parentItemListUtils";
import { IdSchemaType } from "@/schemas/id";
import { ItemClientStateType, ItemDisposition } from "@/types/item";
import { ParentItemListStoreNameType } from "@/types/parentItemList";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import EdiText, { InputProps } from "react-editext";

interface ListItemProps {
  storeName: ParentItemListStoreNameType;
  index: number;
  item: ItemClientStateType;
  setItemDeleted: (itemId: IdSchemaType) => void;
}

const ParentItemListItem = ({ storeName, index, item, setItemDeleted }: ListItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.clientId,
  });
  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const itemSchema = getItemSchemaBasedOnStoreName(storeName);
  const itemFields = getSchemaFields(itemSchema);
  const {
    // register,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemSchema),
  });

  // const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const setItemData = store((state) => state.setItemData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (val: any, inputProps?: InputProps) => {
    if (inputProps?.name) {
      setItemData(item.clientId, { [inputProps.name]: val });
    } else {
      console.log(`ParentItemListitem: missing field name in handleSave(value=`, val, `, inputProps=`, inputProps, `)`);
    }
  };

  return item.disposition === ItemDisposition.Deleted ? null : (
    <li
      className="flex justify-between border-b border-shadow-light dark:border-dark-txt-1 bg-elem-light dark:bg-elem-dark-1"
      ref={setNodeRef}
      style={styles}
      {...attributes}
    >
      <div
        className={cn(
          "basis-1/4 flex items-center gap-x-4 px-4 pb-4 group select-none bg-blend-soft-light bg-background/20 rounded-md",
          {
            "text-muted-foreground": item.disposition !== ItemDisposition.Synced,
            "hover:cursor-grab active:cursor-grabbing": storeName == "achievement",
          },
        )}
        {...listeners}
      >
        <div className="w-full flex flex-col justify-between gap-y-2">
          {itemFields.map((field, index) => (
            <div
              key={index}
              className="w-full text-shadow-dark dark:text-light-txt-1 text-dark-txt-1 dark:text-light-txt-4"
            >
              <EdiText
                key={field}
                type="textarea"
                value={item[field as keyof ItemClientStateType] as string}
                onSave={handleSave}
                inputProps={{ name: field, className: "text-wrap" }}
                viewContainerClassName="flex gap-x-2"
                viewProps={{ className: "flex-1" }}
                showButtonsOnHover
                editOnViewClick
                startEditingOnFocus
                submitOnEnter
                submitOnUnfocus
                cancelOnEscape
              />
            </div>
          ))}
          {/* TODO: Handle and display errors from formState.errors */}
        </div>
      </div>
      <div className="basis-3/4 flex items-center gap-x-4 px-4 py-2 cursor-auto text-xs text-slate-600">
        <p className="h-full flex items-center px-2 text-lg bg-slate-200">{index}</p>
        <table>
          <tbody>
            <tr>
              {/* <td className="py-0">disposition</td> */}
              <td className="py-0">{item.disposition}</td>
            </tr>
          </tbody>
        </table>
        <table className="w-auto">
          <tbody>
            <tr>
              {/* <td className="py-0">lastModified</td> */}
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
              {/* <td className="py-0">createdAt</td> */}
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
      <div className="flex items-center gap-x-4 px-4 pb-4 group">
        {/* /Delete Button */}
        <button
          className="text-light-txt-2 dark:text-light-txt-1 basis-1/12 flex place-name-center opacity-100 md:group-hover:opacity-100 transition-all duration-150"
          title="Delete Item"
          onClick={() => setItemDeleted(item.clientId)}
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
    </li>
  );
};

export default ParentItemListItem;
