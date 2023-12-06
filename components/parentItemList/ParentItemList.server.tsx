// @/components/item/ParentItemList.server.tsx

"use server";

import { getItemList, getParentItemList } from "@/actions/parentItemList";
import { getCurrentUserIdOrNull } from "@/actions/user";
import { IdSchemaType } from "@/schemas/id";
import { ItemServerStateType } from "@/types/item";
import {
  ParentItemListType,
  ParentItemModelAccessor,
  getItemModel,
  parentItemModelHierarchy,
} from "@/types/parentItemList";
import { ResumeActionType } from "@/types/resume";
import ParentItemListClientComponent from "./ParentItemList.client";

export interface ParentItemListServerComponentProps {
  storeName: keyof ParentItemModelAccessor;
  parentId?: IdSchemaType;
  resumeAction?: ResumeActionType;
}

export default async function ParentItemListServerComponent({
  storeName,
  parentId,
  resumeAction,
}: ParentItemListServerComponentProps) {
  // Check if this is a valid `storeName`
  const validStoreName = parentItemModelHierarchy.indexOf(storeName) > 0;
  if (!validStoreName) {
    return (
      <div>
        <h2>
          ParentItemListStore <code>{storeName}</code>
        </h2>
        <p>
          Store name <code>{storeName}</code> is invalid.
        </p>
        <p>Valid store names: {parentItemModelHierarchy.slice(1).join(`, `)}</p>
      </div>
    );
  }

  let derivedParentId: string | null = parentId || null;
  let serverState;

  derivedParentId = await getCurrentUserIdOrNull();
  if (!derivedParentId) {
    throw Error(`Cannot render storeName=${storeName}: current user not found`);
  }

  let itemStoreName: string | null = parentItemModelHierarchy[1];

  while (derivedParentId !== null && itemStoreName !== storeName) {
    const itemList = await getItemList(itemStoreName, derivedParentId);
    if (!(itemList?.length > 0)) {
      return (
        <div>
          <h2>
            ParentItemListStore <code>{storeName}</code>
          </h2>
          <p>
            Store <code>{itemStoreName}</code> does not contain any items with parentId <code>{derivedParentId}</code>
          </p>
        </div>
      );
    }
    derivedParentId = itemList[0].id;
    if ((itemStoreName = getItemModel(itemStoreName)) === null) {
      throw Error(`Invalid storeName=${storeName}`);
    }
  }

  if (itemStoreName && derivedParentId) {
    const serverItems = await getParentItemList(itemStoreName, derivedParentId);
    serverState = {
      ...serverItems,
    } as ParentItemListType<ItemServerStateType, ItemServerStateType>;

    console.log(`ParentItemList.server: serverState:`, serverState);
  } else {
    throw Error(`No entries for parent of storeName=${itemStoreName} found`);
  }

  return !serverState ? null : (
    <div className="space-y-8">
      <ParentItemListClientComponent storeName={itemStoreName} serverState={serverState} resumeAction={resumeAction} />
    </div>
  );
}
