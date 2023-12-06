// @/components/nestedItem/NestedItemList.server.tsx

"use server";

import { getItemsByParentId, getNestedItemList } from "@/actions/nestedItem";
import { getCurrentUserIdOrNull } from "@/actions/user";
import { IdSchemaType } from "@/schemas/id";
import {
  NestedItemListType,
  NestedItemModelAccessor,
  NestedItemServerStateType,
  getChildModel,
  nestedItemModelHierarchy,
} from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import NestedItemClientComponent from "./NestedItemList.client";

export interface NestedItemServerComponentProps {
  storeName: keyof NestedItemModelAccessor;
  parentId: IdSchemaType;
  id?: IdSchemaType;
  resumeAction?: ResumeActionType;
}

export default async function NestedItemServerComponent({
  storeName,
  id,
  resumeAction,
}: NestedItemServerComponentProps) {
  // Check if this is a valid `storeName`
  const validStoreName = nestedItemModelHierarchy.indexOf(storeName) > 0;
  if (!validStoreName) {
    return (
      <div>
        <h2>
          NestedItemStore <code>{storeName}</code>
        </h2>
        <p>
          Store name <code>{storeName}</code> is invalid.
        </p>
        <p>Valid store names: {nestedItemModelHierarchy.slice(1).join(`, `)}</p>
      </div>
    );
  }

  let derivedItemId: string | null = id || null;
  let serverState;

  derivedItemId = await getCurrentUserIdOrNull();
  if (!derivedItemId) {
    throw Error(`NestedItemServerComponent: Cannot render storeName=${storeName}: current user not found`);
  }

  // Start with a list of resumes owned by the current user
  let itemStoreName: string | null = nestedItemModelHierarchy[0];
  if (itemStoreName !== "user") {
    throw Error(`NestedItemServerComponent: invalid initial storeName=${itemStoreName}; should be "user"`);
  }

  while (derivedItemId !== null) {
    if ((itemStoreName = getChildModel(itemStoreName)) === null) {
      throw Error(`Invalid storeName=${storeName}`);
    }
    const itemList: Array<NestedItemServerStateType> = await getItemsByParentId(itemStoreName, derivedItemId);
    if (itemList?.length > 0) {
      derivedItemId = itemList[0].id;
      if (itemStoreName === storeName) {
        break;
      }
    } else {
      return (
        <div>
          <h2>
            NestedItemStore <code>{storeName}</code>
          </h2>
          <p>
            Store <code>{itemStoreName}</code> does not contain any items with id <code>{derivedItemId}</code>
          </p>
        </div>
      );
    }
  }

  if (itemStoreName && derivedItemId) {
    const serverItems = await getNestedItemList(itemStoreName, derivedItemId);
    serverState = {
      ...serverItems,
    } as NestedItemListType<NestedItemServerStateType, NestedItemServerStateType>;

    console.log(`NestedItem.server: serverState:`, serverState);
  } else {
    throw Error(`No entries for parent of storeName=${itemStoreName} found`);
  }

  return !serverState ? null : (
    <div className="space-y-8">
      <NestedItemClientComponent storeName={itemStoreName} serverState={serverState} resumeAction={resumeAction} />
    </div>
  );
}
