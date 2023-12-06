// @/components/nestedItem/NestedItem.server.tsx

"use server";

import { getNestedItemList } from "@/actions/nestedItem";
import { getCurrentUserIdOrNull } from "@/actions/user";
import { ResumeActionPageProps } from "@/app/(authenticated)/resume/[id]/[action]/page";
import { IdSchemaType } from "@/schemas/id";
import {
  NestedItemListType,
  NestedItemModelAccessor,
  NestedItemServerStateType,
  getChildModel,
} from "@/types/nestedItem";
import NestedItemClientComponent from "./NestedItemList.client";

export interface ResumeNestedItemListServerComponentProps {
  storeName: keyof NestedItemModelAccessor;
  parentId?: IdSchemaType;
  id?: ResumeActionPageProps["params"]["id"];
  resumeAction?: ResumeActionPageProps["params"]["action"];
}

async function fetchServerState(
  storeName: keyof NestedItemModelAccessor,
  parentId: IdSchemaType,
): Promise<NestedItemListType<NestedItemServerStateType, NestedItemServerStateType>> {
  // Get list of descendants that belong to the given `parentId`
  const serverNestedItem = await getNestedItemList(storeName, parentId);
  return serverNestedItem;
}

export default async function ResumeNestedItemListServerComponent(props: ResumeNestedItemListServerComponentProps) {
  const { storeName, parentId, id, resumeAction } = props;

  let rootParentId = parentId || (await getCurrentUserIdOrNull());
  let rootStoreName: string | null = storeName;

  const errPrefix = `ResumeNestedItemListServerComponent(storeName=${storeName}, parentId=${parentId} id=${id}): `;
  if (!rootParentId) {
    throw Error(`${errPrefix}invalid rootParentId=${rootParentId}`);
  }

  // If parameter `id` is provided, only render one item and its descendants
  // Typicall, this `id` will be provided at the `resume` level and the
  // component will render this specific resume
  if (id && rootStoreName) {
    rootParentId = id;
    rootStoreName = getChildModel(rootStoreName);
  }

  if (!rootStoreName) {
    throw Error(`${errPrefix}invalid rootStoreName=${rootStoreName}`);
  }

  // Determine the storeName of the descendants
  const itemStoreName = getChildModel(rootStoreName);

  // Fetch server state for the current level
  const serverState = await fetchServerState(rootStoreName, rootParentId);

  // Fetch descendants and recursively generate components for each child
  if (rootStoreName && itemStoreName) {
    const validRootStoreName = rootStoreName;
    const validItemStoreName = itemStoreName;
    const itemServerComponents = serverState.descendants.map((item: NestedItemServerStateType, index: number) => {
      const rootItems = serverState.descendants.filter((rootItem) => rootItem.id === item.id);
      const rootServerState = { ...serverState, descendants: rootItems };
      return (
        <div key={item.id}>
          <NestedItemClientComponent
            storeName={validRootStoreName}
            serverState={rootServerState}
            resumeAction={resumeAction}
          />

          <ResumeNestedItemListServerComponent
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
        <NestedItemClientComponent storeName={storeName} serverState={serverState} resumeAction={resumeAction} />
      </div>
    );
  }
}
