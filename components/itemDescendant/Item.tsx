// @/components/itemDescendant/ItemDescendantItem.tsx

import { useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { cn } from "@/lib/utils";
import { DateTimeFormat, DateTimeSeparator, dateToISOLocal } from "@/lib/utils/formatDate";
import { getItemSchema, getSchemaFields } from "@/lib/utils/itemDescendantListUtils";
import { ItemDescendantClientStateType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import useSettingsStore from "@/stores/settings/useSettingsStore";
import { ItemClientStateType, ItemDataUntypedType, ItemDisposition } from "@/types/item";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputProps } from "react-editext";
import { useForm } from "react-hook-form";
import { ItemDescendantRenderProps } from "./ItemDescendantList.client";
import EditableFieldPersisted from "./utils/EditableFieldPersist";

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

  const settingsStore = useSettingsStore();
  const { showItemDescendantInternals } = settingsStore;
  const showListItemInternals = process.env.NODE_ENV === "development" && showItemDescendantInternals;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const handleSave = (val: any, inputProps?: InputProps) => {
    if (inputProps?.name) {
      setItemData({ [inputProps.name]: val } as ItemDataUntypedType, item.clientId);
    } else {
      console.log(`Item: missing field name in handleSave(value=`, val, `, inputProps=`, inputProps, `)`);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (val: any, inputProps?: InputProps) => {
    if (inputProps?.name) {
      setItemData({ [inputProps.name]: val } as ItemDataUntypedType, item.clientId);
    } else {
      console.log(`Item: missing field name in handleSave(value=`, val, `, inputProps=`, inputProps, `)`);
    }
  };

  return (
    <div className="flex-1 flex justify-between">
      <div className="flex-1 flex gap-x-4 gap-y-2 justify-between">
        {itemFormFields.map((field, index) => (
          <div
            key={index}
            className="flex-1 text-shadow-dark dark:text-light-txt-1 text-dark-txt-1 dark:text-light-txt-4"
          >
            <EditableFieldPersisted
              key={field}
              fieldName={field}
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
  );
}
