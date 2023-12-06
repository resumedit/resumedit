// @/components/item/ParentItemList.server.tsx

"use server";

import { getItemList, getParentItemList } from "@/actions/parentItemList";
import { getCurrentUserOrNull } from "@/actions/user";
import { ResumePageProps } from "@/app/(marketing)/item/resume/[action]/[id]/page";
import { IdSchemaType } from "@/schemas/id";
import { ItemServerStateType } from "@/types/item";
import { ParentItemListType, ParentItemModelAccessor, getItemModel } from "@/types/parentItemList";
import { ReactNode } from "react";
import ParentItemListClientComponent from "./ParentItemList.client";

export interface ParentItemListServerComponentProps {
  storeName: keyof ParentItemModelAccessor;
  action?: ResumePageProps["params"]["action"];
  id?: ResumePageProps["params"]["id"];
  parentId?: IdSchemaType;
}

export default async function ParentItemListServerComponent(
  props: ParentItemListServerComponentProps,
): Promise<ReactNode> {
  const { storeName, action, id, parentId } = props;

  // If there is an id, we treat it as the id of a `Resume`
  if (id) {
    const itemStoreName = getItemModel(storeName);
    if (itemStoreName) {
      return await ParentItemListServerComponent({ storeName: itemStoreName, action: action, parentId: id });
    }
  }

  if (parentId) {
    const itemStoreName = getItemModel(storeName);
    if (itemStoreName === null) {
      // Get list of items that belong to the given `parentId`
      const serverItems = await getParentItemList(storeName, parentId);
      // For each item, fetch the server state and generate an array of records to render all items:
      // [{parentId: <parentId>, serverState: <serverState> }]
      const serverStateListPromises = (await serverItems.items.map(async (item: ItemServerStateType) => {
        return { parentId: item.id, serverState: await getParentItemList(storeName, item.id) };
      })) as ParentItemListType<ItemServerStateType>[];
      const serverStateList = await Promise.all(serverStateListPromises);

      console.log(`ItemList.server: serverStateList:`, serverStateList);
      return !(serverStateList?.length > 0) ? null : (
        <div className="space-y-8">
          {serverStateList.map((serverState, index) => {
            return <ParentItemListClientComponent key={index} storeName={storeName} serverState={serverState} />;
          })}
        </div>
      );
    } else {
      const serverItems = await getParentItemList(storeName, parentId);
      // const serverItemPromises = await serverItems.items.map(async (item, index) => {
      //   return await ParentItemListServerComponent({ storeName: itemStoreName, action: action, parentId: item.id });
      // });
      // const serverItemList = await Promise.all(serverItemPromises);

      const serverState = {
        ...serverItems,
      } as ParentItemListType<ItemServerStateType>;

      return (
        <>
          <ParentItemListClientComponent storeName={storeName} serverState={serverState} />
          {serverItems.items.map((item: ItemServerStateType, index: number) => {
            return (
              <ParentItemListServerComponent key={index} storeName={itemStoreName} action={action} parentId={item.id} />
            );
          })}
        </>
      );
    }
  }

  let derivedParentId: string | undefined = parentId;
  let serverState;

  // If there is no id, we only continue if the storeName is `resume` or we are in debug mode
  if (storeName !== "resume" && process.env.NODE_ENV !== "development") {
    return null;
  }

  const user = await getCurrentUserOrNull();
  if (!user) {
    throw Error(`No entries for parent of storeName=${props.storeName} found`);
  }
  derivedParentId = user.id;
  let itemStoreName: string | null = "resume";

  while (derivedParentId !== undefined && itemStoreName !== storeName) {
    const itemList = await getItemList(itemStoreName, derivedParentId);
    if (!(itemList?.length > 0)) {
      return null;
    }
    derivedParentId = itemList[0].id;
    if ((itemStoreName = getItemModel(itemStoreName)) === null) {
      throw Error(`Invalid storeName=${props.storeName}`);
    }
  }

  if (itemStoreName && derivedParentId) {
    const serverItems = await getParentItemList(itemStoreName, derivedParentId);
    serverState = {
      ...serverItems,
    } as ParentItemListType<ItemServerStateType>;

    console.log(`ItemList.server: serverState:`, serverState);
  } else {
    throw Error(`No entries for parent of storeName=${itemStoreName} found`);
  }

  return !serverState ? null : (
    <div className="space-y-8">
      <ParentItemListClientComponent storeName={itemStoreName} serverState={serverState} />
    </div>
  );
}
