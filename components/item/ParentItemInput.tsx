// @/components/item/ParentItemInput.tsx

"use client";

import { Button } from "@/components/ui/button";
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { getItemSchema, getSchemaFields } from "@/lib/utils/parentItemListUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";

const ParentItemListInput = () => {
  const storeName = useStoreName();
  const itemFormSchema = getItemSchema(storeName, "form");
  const itemDisplayFields = getSchemaFields(storeName, "display");

  const {
    register,
    handleSubmit,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formState: { errors },
  } = useForm({
    resolver: zodResolver(itemFormSchema),
  });

  const store = useParentItemListStore(storeName);
  const parentId = store((state) => state.parentId);
  const addItem = store((state) => state.addItem);

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    // Add the new item
    addItem({ ...data, parentId });
  };

  return parentId ? (
    <form
      className="px-4 py-2 mt-8 bg-elem-light dark:bg-elem-dark-1 flex items-center gap-x-3 rounded-md"
      onSubmit={handleSubmit(onSubmit)}
    >
      {itemDisplayFields.map((field) => (
        <input
          key={field}
          {...register(field)}
          placeholder={field}
          className="border-none focus:ring-0 w-full p-2 dark:bg-elem-dark-1 dark:placeholder:text-shadow-light dark:caret-active-blue text-shadow-dark dark:text-light-txt-1"
        />
      ))}
      {/* Display errors here */}
      <Button type="submit">Add Item</Button>
    </form>
  ) : null;
};

export default ParentItemListInput;
