// @/components/nestedItemRecursive/NestedItemRecursive.server.tsx

"use server";

import { getItemsByParentId, getNestedItemList } from "@/actions/nestedItem";
import { getCurrentUserIdOrNull } from "@/actions/user";
import { IdSchemaType } from "@/schemas/id";
import {
  NestedItemModelAccessor,
  NestedItemServerStateType,
  getDescendantModel,
  nestedItemModelHierarchy,
} from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import NestedItemRecursiveClientComponent from "./NestedItemRecursive.client";

export interface NestedItemRecursiveServerComponentProps {
  rootItemModel: keyof NestedItemModelAccessor;
  parentId: IdSchemaType;
  id?: IdSchemaType;
  resumeAction?: ResumeActionType;
}

export default async function NestedItemRecursiveServerComponent({
  rootItemModel,
  parentId,
  id,
  ...props
}: NestedItemRecursiveServerComponentProps) {
  // Check if this is a valid `rootItemModel`
  const validStoreName = nestedItemModelHierarchy.indexOf(rootItemModel) >= 0;
  if (!validStoreName) {
    return (
      <div>
        <p>
          <code className="text-sm">rootItemModel=&quot;{rootItemModel}&quot;</code> is invalid.
        </p>
        <p>
          Valid values: <code className="text-sm">{nestedItemModelHierarchy.join(`, `)}</code>
        </p>
      </div>
    );
  }

  const userId = await getCurrentUserIdOrNull();
  if (!userId) {
    throw Error(
      `NestedItemRecursiveServerComponent: Cannot render rootItemModel=${rootItemModel}: current user not found`,
    );
  }

  const resumeAction = props.resumeAction ? props.resumeAction : "view";

  let serverState,
    leafItemModel = nestedItemModelHierarchy[nestedItemModelHierarchy.length - 1];

  // If we are at the top level ("user"), we only show a flat list of
  // direct descendants of type "resume"
  if (rootItemModel === nestedItemModelHierarchy[0]) {
    const itemModel = rootItemModel;
    leafItemModel = getDescendantModel(itemModel)!;
    console.log(`rootItemModel=${rootItemModel} id=${id} itemModel=${itemModel} parentId=${parentId}`);
    serverState = await getNestedItemList(itemModel, parentId);
    console.log(`NestedItemRecursiveServerComponent: serverState:`, serverState);
  } else {
    // Otherwise we look for the latest item of the given rootItemModel
    let derivedItemId: string | null = id || userId;

    // Start with a list of resumes owned by the current user
    let itemModel: string | null = nestedItemModelHierarchy[0];
    if (itemModel !== "user") {
      throw Error(`NestedItemRecursiveServerComponent: invalid initial rootItemModel=${itemModel}; should be "user"`);
    }

    while (derivedItemId !== null) {
      if ((itemModel = getDescendantModel(itemModel)) === null) {
        throw Error(`Invalid rootItemModel=${rootItemModel}`);
      }
      const itemList: Array<NestedItemServerStateType> = await getItemsByParentId(itemModel, derivedItemId);
      if (itemList?.length > 0) {
        derivedItemId = itemList[0].id;
        if (itemModel === rootItemModel) {
          break;
        }
      } else {
        return (
          <div>
            <h2>
              NestedItemRecursiveServerComponent(<code>rootItemModel=&quot;{rootItemModel}&quot;</code>)
            </h2>
            <p>
              Store <code>{itemModel}</code> does not contain any items with id <code>{derivedItemId}</code>
            </p>
          </div>
        );
      }
    }

    if (itemModel && derivedItemId) {
      const serverState = await getNestedItemList(itemModel, derivedItemId);

      console.log(`NestedItemRecursiveServerComponent: serverState:`, serverState);
    } else {
      throw Error(
        `NestedItemRecursiveServerComponent: getNestedItemList(itemModel=${itemModel}, derivedItemId=${derivedItemId}) returned nothing`,
      );
    }
  }

  return !serverState ? null : (
    <NestedItemRecursiveClientComponent
      serverState={serverState}
      rootItemModel={rootItemModel}
      leafItemModel={leafItemModel}
      resumeAction={resumeAction}
    />
  );
}
