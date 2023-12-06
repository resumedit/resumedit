// @/components/item/ParentItemList.server.tsx

"use server";

import { getParentItemList } from "@/actions/parentItemList";
import { getCurrentUserIdOrNull } from "@/actions/user";
import { ResumeActionPageProps } from "@/app/(authenticated)/resume/[id]/[action]/page";
import { IdSchemaType } from "@/schemas/id";
import { ItemServerStateType } from "@/types/item";
import { ParentItemListType, ParentItemModelAccessor, getItemModel } from "@/types/parentItemList";
import ParentItemListClientComponent from "./ParentItemList.client";

export interface NestedParentItemListServerComponentProps {
  storeName: keyof ParentItemModelAccessor;
  parentId?: IdSchemaType;
  id?: ResumeActionPageProps["params"]["id"];
  resumeAction?: ResumeActionPageProps["params"]["action"];
}

async function fetchServerState(
  storeName: keyof ParentItemModelAccessor,
  parentId: IdSchemaType,
): Promise<ParentItemListType<ItemServerStateType, ItemServerStateType>> {
  // Get list of items that belong to the given `parentId`
  const serverParentItemList = await getParentItemList(storeName, parentId);
  return serverParentItemList;
}

export default async function NestedParentItemListServerComponent(props: NestedParentItemListServerComponentProps) {
  const { storeName, parentId, id, resumeAction } = props;

  let rootParentId = parentId || (await getCurrentUserIdOrNull());
  let rootStoreName: string | null = storeName;

  const errPrefix = `NestedParentItemListServerComponent(storeName=${storeName}, parentId=${parentId} id=${id}): `;
  if (!rootParentId) {
    throw Error(`${errPrefix}invalid rootParentId=${rootParentId}`);
  }

  // If parameter `id` is provided, only render one item and its children
  // Typicall, this `id` will be provided at the `resume` level and the
  // component will render this specific resume
  if (id && rootStoreName) {
    rootParentId = id;
    rootStoreName = getItemModel(rootStoreName);
  }

  if (!rootStoreName) {
    throw Error(`${errPrefix}invalid rootStoreName=${rootStoreName}`);
  }

  // Determine the storeName of the children
  const itemStoreName = getItemModel(rootStoreName);

  // Fetch server state for the current level
  const serverState = await fetchServerState(rootStoreName, rootParentId);

  // Fetch children and recursively generate components for each child
  if (rootStoreName && itemStoreName) {
    const validRootStoreName = rootStoreName;
    const validItemStoreName = itemStoreName;
    const itemServerComponents = serverState.items.map((item: ItemServerStateType, index: number) => {
      const rootItems = serverState.items.filter((rootItem) => rootItem.id === item.id);
      const rootServerState = { ...serverState, items: rootItems };
      return (
        <div key={item.id}>
          <ParentItemListClientComponent
            storeName={validRootStoreName}
            serverState={rootServerState}
            resumeAction={resumeAction}
          />

          <NestedParentItemListServerComponent
            key={index}
            storeName={validItemStoreName}
            resumeAction={resumeAction}
            parentId={item.id}
          />
        </div>
      );
    });
    return <div className="bg-slate-100">{itemServerComponents}</div>;
  } else {
    return (
      <div>
        <ParentItemListClientComponent storeName={storeName} serverState={serverState} resumeAction={resumeAction} />
      </div>
    );
  }
}
