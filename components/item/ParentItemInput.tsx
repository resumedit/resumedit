// @/components/item/ParentItemInput.tsx

"use client";

import { getUserById } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useParentItemListStore } from "@/contexts/ParentItemListStoreContext";
import { useStoreName } from "@/contexts/StoreNameContext";
import { IdSchemaType } from "@/schemas/id";
import { ItemClientStateType } from "@/types/item";
import { useEffect, useRef } from "react";

const ParentItemListInput = () => {
  const storeName = useStoreName();
  const store = useParentItemListStore(storeName);
  const parentId = store((state) => state.parentId);
  const addItem = store((state) => state.addItem);

  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const itemContentInputRef = useRef<HTMLInputElement>(null);
  const userFirstNameOutputRef = useRef<HTMLSpanElement>(null);
  const userLastNameOutputRef = useRef<HTMLSpanElement>(null);
  const userEmailOutputRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    async function fetchUserFromServer(parentId: IdSchemaType) {
      const user = await getUserById(parentId);
      if (userFirstNameOutputRef.current) {
        userFirstNameOutputRef.current.innerText = user?.firstName || "N/A";
      }
      if (userLastNameOutputRef.current) {
        userLastNameOutputRef.current.innerText = user?.lastName || "N/A";
      }
      if (userEmailOutputRef.current) {
        userEmailOutputRef.current.innerText = user?.email || "N/A";
      }
    }
    if (parentId) {
      fetchUserFromServer(parentId);
    }
  }, [parentId]);

  const addNewItem = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const itemName = itemNameInputRef.current?.value.trim();
    const itemContent = itemContentInputRef.current?.value.trim() || "1";

    if (!itemName) return;

    if (!parentId) {
      throw Error(`addNewItem: invalid parentId: ${parentId}`);
    }

    const data = {
      name: itemName,
      content: itemContent,
    } as Omit<ItemClientStateType, keyof ItemClientStateType>;

    addItem(data);

    if (itemNameInputRef.current) {
      itemNameInputRef.current.value = "";
    }
    if (itemContentInputRef.current) {
      itemContentInputRef.current.value = "";
    }
  };

  return !parentId ? null : (
    <div>
      <p>
        <span className="uppercase text-muted-foreround text-sm">Name</span> <span ref={userFirstNameOutputRef}></span>{" "}
        <span ref={userLastNameOutputRef}></span>
        <span className="mx-2"></span>
        <span className="uppercase text-muted-foreround text-sm">Email</span> <span ref={userEmailOutputRef}></span>
      </p>
      <form
        className="px-4 py-2 mt-8 bg-elem-light dark:bg-elem-dark-1 flex items-center gap-x-3 rounded-md"
        onSubmit={addNewItem}
        name="addNewItemForm"
      >
        <Button type="submit">Add item</Button>
        <div className="flex-1 flex gap-4">
          <input
            type="text"
            placeholder="Name"
            className="border-none focus:ring-0 w-full p-2 dark:bg-elem-dark-1 dark:placeholder:text-shadow-light dark:caret-active-blue text-shadow-dark dark:text-light-txt-1"
            ref={itemNameInputRef}
          />
          <input
            type="text"
            placeholder="Content"
            className="border-none focus:ring-0 w-full p-2 dark:bg-elem-dark-1 dark:placeholder:text-shadow-light dark:caret-active-blue text-shadow-dark dark:text-light-txt-1"
            ref={itemContentInputRef}
          />
        </div>
      </form>
    </div>
  );
};

export default ParentItemListInput;
