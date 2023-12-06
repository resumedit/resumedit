// @/components/itemDescendant/ItemDescendant.server.tsx

"use server";

import { getItemDescendantList, getItemsByParentId } from "@/actions/itemDescendant";
import { getCurrentUserIdOrNull } from "@/actions/user";
import { IdSchemaType } from "@/schemas/id";
import { ItemServerStateDescendantListType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemServerToClientType } from "@/types/item";
import { ItemDescendantModelAccessor, getDescendantModel, itemDescendantModelHierarchy } from "@/types/itemDescendant";
import { ResumeActionType } from "@/types/resume";
import ItemDescendantClientComponent from "./ItemDescendant.client";

export interface ItemDescendantServerComponentProps {
  rootItemModel: keyof ItemDescendantModelAccessor;
  parentId: IdSchemaType;
  id?: IdSchemaType;
  resumeAction?: ResumeActionType;
}

export default async function ItemDescendantServerComponent({
  rootItemModel,
  parentId,
  id,
  ...props
}: ItemDescendantServerComponentProps) {
  // Check if this is a valid `rootItemModel`
  const validModelName = itemDescendantModelHierarchy.indexOf(rootItemModel) >= 0;
  if (!validModelName) {
    return (
      <div>
        <p>
          Invalid item model <code className="text-sm">rootItemModel=&quot;{rootItemModel}&quot;</code>.
        </p>
        <p>
          Valid models: <code className="text-sm">{itemDescendantModelHierarchy.join(`, `)}</code>
        </p>
      </div>
    );
  }

  const userId = await getCurrentUserIdOrNull();
  if (!userId) {
    throw Error(`ItemDescendantServerComponent: Cannot render rootItemModel=${rootItemModel}: current user not found`);
  }

  const resumeAction = props.resumeAction ? props.resumeAction : "view";

  let serverState,
    leafItemModel = itemDescendantModelHierarchy[itemDescendantModelHierarchy.length - 1];

  // If we are at the top level ("user"), we only show a flat list of
  // direct descendants of type "resume"
  if (rootItemModel === itemDescendantModelHierarchy[0]) {
    const itemModel = rootItemModel;
    leafItemModel = getDescendantModel(itemModel)!;
    console.log(`rootItemModel=${rootItemModel} id=${id} itemModel=${itemModel} parentId=${parentId}`);
    serverState = await getItemDescendantList(itemModel, parentId);
    console.log(`ItemDescendantServerComponent: serverState:`, serverState);
  } else {
    // Otherwise we look for the latest item of the given rootItemModel
    let derivedItemId: string | null = id || userId;

    // Start with a list of resumes owned by the current user
    let itemModel: string | null = itemDescendantModelHierarchy[0];
    if (itemModel !== "user") {
      throw Error(`ItemDescendantServerComponent: invalid initial rootItemModel=${itemModel}; should be "user"`);
    }

    while (derivedItemId !== null) {
      if ((itemModel = getDescendantModel(itemModel)) === null) {
        throw Error(`Invalid rootItemModel=${rootItemModel}`);
      }
      const itemList: ItemServerStateDescendantListType<ItemServerToClientType, ItemServerToClientType> =
        await getItemsByParentId(itemModel, derivedItemId);
      if (itemList?.length > 0) {
        derivedItemId = itemList[0].id;
        if (itemModel === rootItemModel) {
          break;
        }
      } else {
        return (
          <div>
            <h2>
              ItemDescendantServerComponent(<code>rootItemModel=&quot;{rootItemModel}&quot;</code>)
            </h2>
            <p>
              Store <code>{itemModel}</code> does not contain any items with id <code>{derivedItemId}</code>
            </p>
          </div>
        );
      }
    }

    if (itemModel && derivedItemId) {
      serverState = await getItemDescendantList(itemModel, derivedItemId);

      console.log(`ItemDescendantServerComponent: serverState:`, serverState);
    } else {
      throw Error(
        `ItemDescendantServerComponent: getItemDescendantList(itemModel=${itemModel}, derivedItemId=${derivedItemId}) returned nothing`,
      );
    }
  }

  return !serverState ? null : (
    <ItemDescendantClientComponent
      serverState={serverState}
      rootItemModel={rootItemModel}
      leafItemModel={leafItemModel}
      resumeAction={resumeAction}
    />
  );
}
