// @/components/itemDescendant/ItemDescendant.server.tsx

"use server";

import { getItemDescendantList, getItemsByParentId } from "@/actions/itemDescendant";
import { getCurrentUserIdOrNull } from "@/actions/user";
import { IdSchemaType } from "@/schemas/id";
import {
  ItemDescendantModelAccessor,
  ItemDescendantModelNameType,
  getDescendantModel,
  getParentModel,
  itemDescendantModelHierarchy,
} from "@/types/itemDescendant";
import { ResumeActionType } from "@/types/resume";
import ItemDescendantListContext from "./ItemDescendantList.client";

export interface ItemDescendantListProps {
  itemModel: keyof ItemDescendantModelAccessor;
  itemId?: IdSchemaType;
  resumeAction?: ResumeActionType;
}

async function RenderLevels({
  itemModel,
  levels,
}: {
  itemModel: keyof ItemDescendantModelAccessor;
  levels: Array<Record<string, string>>;
}) {
  return (
    <>
      <h1>
        ItemDescendantServerComponent(<code>itemModel=&quot;{itemModel}&quot;</code>)
      </h1>
      {levels.length === 0 ? null : (
        <ul>
          {levels.map((level, index) => {
            return (
              <li key={index}>
                {index}: {level.itemModel}: <code className="text-sm">{level.itemId}</code>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default async function ItemDescendantList({ itemModel, itemId, ...props }: ItemDescendantListProps) {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) {
    throw Error(`ItemDescendantServerComponent: Cannot render itemModel=${itemModel}: current user not found`);
  }

  if (itemModel === itemDescendantModelHierarchy[0]) {
    itemId = itemId ? itemId : userId;
  }

  const resumeAction = props.resumeAction ? props.resumeAction : "view";

  // Check if `itemModel` is a valid model
  const validModelName = itemDescendantModelHierarchy.indexOf(itemModel) >= 0;
  if (!validModelName) {
    return (
      <div>
        <p>
          Invalid item model <code className="text-sm">itemModel=&quot;{itemModel}&quot;</code>.
        </p>
        <p>
          Valid models: <code className="text-sm">{itemDescendantModelHierarchy.join(`, `)}</code>
        </p>
      </div>
    );
  }

  let serverState,
    levels: Array<Record<string, string>> = [],
    leafItemModel: ItemDescendantModelNameType | null =
      itemDescendantModelHierarchy[itemDescendantModelHierarchy.length - 1];

  if (itemId) {
    // If we are at the top level ("user"), we only show a flat list of
    // direct descendants, which are currently using the model "resume"
    if (itemModel === itemDescendantModelHierarchy[0]) {
      leafItemModel = getDescendantModel(itemModel)!;
      console.log(`itemModel=${itemModel}   itemId=${itemId} itemModel=${itemModel} itemId=${itemId}`);
      serverState = await getItemDescendantList(itemModel, itemId);
      console.log(`ItemDescendantServerComponent: serverState:`, serverState);
    } else {
      serverState = await getItemDescendantList(itemModel, itemId);
    }
  } else {
    // Otherwise:
    // - If itemModel is resume, we show all resumes of the user
    // - For any other itemModel, we try to descend the hierarchy along the least
    // recently created item of the given itemModel
    const targetItemModel = itemModel;
    let derivedItemId: string = userId;

    // Start with a list of resumes owned by the current user
    let derivedItemModel: string = itemDescendantModelHierarchy[0];
    if (derivedItemModel !== "user") {
      throw Error(`ItemDescendantServerComponent: invalid initial itemModel=${derivedItemModel}; should be "user"`);
    }
    levels = [{ itemModel: derivedItemModel, itemId: derivedItemId }];

    while ((leafItemModel = getDescendantModel(derivedItemModel)) !== targetItemModel && leafItemModel) {
      derivedItemModel = leafItemModel;
      const itemList = await getItemsByParentId(derivedItemModel, derivedItemId);
      if (itemList?.length > 0) {
        derivedItemId = itemList[0].id;
        levels = [...levels, { itemModel: derivedItemModel, itemId: derivedItemId }];
      } else {
        return (
          <>
            <RenderLevels itemModel={targetItemModel} levels={levels} />
            <p>
              Failed to descend to <code>{derivedItemModel}</code>: <code>{getParentModel(derivedItemModel)}</code> with
              itemId <code>{derivedItemId}</code> has no descendants.
            </p>
          </>
        );
      }
    }
    if (!derivedItemModel) {
      throw Error(
        `ItemDescendantServerComponent: ItemDescendantServerComponent(itemModel=${itemModel}): Failed to descend to this model`,
      );
    }

    if (leafItemModel && derivedItemId) {
      serverState = await getItemDescendantList(derivedItemModel, derivedItemId);

      console.log(`ItemDescendantServerComponent: serverState:`, serverState);
    } else {
      throw Error(
        `ItemDescendantServerComponent: getItemDescendantList(leafItemModel=${leafItemModel}, derivedItemId=${derivedItemId}) returned nothing`,
      );
    }
  }

  return !serverState ? null : (
    <>
      <RenderLevels itemModel={itemModel} levels={levels} />
      <ItemDescendantListContext
        serverState={serverState}
        rootItemModel={itemModel}
        leafItemModel={leafItemModel}
        resumeAction={resumeAction}
      />
    </>
  );
}
