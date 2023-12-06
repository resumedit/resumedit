// @/components/itemDescendant/ItemDescendant.server.tsx

"use server";

import { getItemDescendantList, getItemsByParentId } from "@/actions/itemDescendant";
import { getCurrentUserIdOrNull } from "@/actions/user";
import { IdSchemaType } from "@/schemas/id";
import {
  ItemDescendantModelNameType,
  getDescendantModel,
  getParentModel,
  itemDescendantModelHierarchy,
} from "@/types/itemDescendant";
import { ResumeActionType } from "@/types/resume";
import { augmentToItemDescendantServerState } from "@/types/utils/itemDescendant";
import ItemDescendantListContext from "./ItemDescendantList.client";
import { notFound } from "next/navigation";

export interface ItemDescendantListProps {
  itemModel: ItemDescendantModelNameType;
  itemId?: IdSchemaType;
  resumeAction?: ResumeActionType;
}

export default async function ItemDescendantList({ itemModel, itemId, ...props }: Readonly<ItemDescendantListProps>) {
  let serverState,
    resumeAction: ResumeActionType,
    levels: Array<Record<string, string>> = [],
    leafItemModel: ItemDescendantModelNameType | null =
      itemDescendantModelHierarchy[itemDescendantModelHierarchy.length - 1];

  try {
    const userId = await getCurrentUserIdOrNull();
    if (!userId) {
      throw Error(`ItemDescendantServerComponent: Cannot render itemModel=${itemModel}: current user not found`);
    }

    if (itemModel === itemDescendantModelHierarchy[0]) {
      itemId = itemId ?? userId;
    }

    resumeAction = props.resumeAction ?? itemModel === itemDescendantModelHierarchy[0] ? "edit" : "view";

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

    let serverOutput;

    if (itemId) {
      // If we are at the top level ("user"), we only show a flat list of
      // direct descendants, which are currently using the model "resume"
      if (itemModel === itemDescendantModelHierarchy[0]) {
        leafItemModel = getDescendantModel(itemModel)!;
        console.log(`itemModel=${itemModel}   itemId=${itemId} itemModel=${itemModel} itemId=${itemId}`);
        serverOutput = await getItemDescendantList(itemModel, itemId);
        console.log(`ItemDescendantServerComponent: serverOutput:`, serverOutput);
      } else {
        serverOutput = await getItemDescendantList(itemModel, itemId);
      }
    } else {
      // Otherwise:
      // - If itemModel is resume, we show all resumes of the user
      // - For any other itemModel, we try to descend the hierarchy along the least
      // recently created item of the given itemModel
      const targetItemModel = itemModel;
      let derivedItemId: IdSchemaType = userId;

      // Start with a list of resumes owned by the current user
      let derivedItemModel: ItemDescendantModelNameType = itemDescendantModelHierarchy[0];
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
                Failed to descend to <code>{derivedItemModel}</code>: <code>{getParentModel(derivedItemModel)}</code>{" "}
                with itemId <code>{derivedItemId}</code> has no descendants.
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
        serverOutput = await getItemDescendantList(derivedItemModel, derivedItemId);

        console.log(`ItemDescendantServerComponent: serverOutput:`, serverOutput);
      } else {
        throw Error(
          `ItemDescendantServerComponent: getItemDescendantList(leafItemModel=${leafItemModel}, derivedItemId=${derivedItemId}) returned nothing`,
        );
      }
    }

    serverState = augmentToItemDescendantServerState(serverOutput, itemModel);
  } catch (exc) {
    if (process.env.NODE_ENV === "development") {
      throw exc;
    } else {
      notFound();
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

async function RenderLevels({
  itemModel,
  levels,
}: Readonly<{
  itemModel: ItemDescendantModelNameType;
  levels: Array<Record<string, string>>;
}>) {
  return (
    <>
      <h1>
        ItemDescendantServerComponent(<code>itemModel=&quot;{itemModel}&quot;</code>)
      </h1>
      {levels.length === 0 ? null : (
        <ul>
          {levels.map((level, index) => {
            return (
              <li key={level.itemId}>
                {index}: {level.itemModel}: <code className="text-sm">{level.itemId}</code>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
