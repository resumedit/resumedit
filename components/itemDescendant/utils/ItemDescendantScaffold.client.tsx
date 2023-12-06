// @/components/itemDescendant/ItemDescendantScaffold.client.tsx

"use client";

import { ItemDescendantStoreProvider, useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { getItemId } from "@/schemas/id";
import { ItemDescendantClientStateType } from "@/stores/itemDescendantStore/createItemDescendantStore";
import { AchievementItemClientStateType } from "@/types/achievement";
import { ItemClientStateType } from "@/types/item";
import { getParentModel } from "@/types/itemDescendant";
import { OrganizationItemClientStateType } from "@/types/organization";
import { ResumeItemClientStateType } from "@/types/resume";
import { RoleItemClientStateType } from "@/types/role";
import { UserItemClientStateType } from "@/types/user";
import { useEffect, useState } from "react";
import { ItemDescendantListContextProps } from "../ItemDescendantList.client";

const ItemDescendantScaffold = ({
  item,
}: {
  item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>;
}) => {
  const renderItemBasedOnLevel = (item: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>) => {
    let modelItem;
    switch (item.itemModel) {
      case "user":
        modelItem = item as unknown as UserItemClientStateType;
        // Render user details
        return (
          <div key={item.clientId} id={item.clientId}>
            <h1>User</h1>
            <p>
              {modelItem.firstName} {modelItem.lastName} &lt;{modelItem.email}&gt;
            </p>
          </div>
        );
      case "resume":
        modelItem = item as unknown as ResumeItemClientStateType;
        // Render resume details
        return (
          <div key={item.clientId} id={item.clientId}>
            <h2>Resume</h2>
            <p>{modelItem.name}</p>
          </div>
        );
      case "organization":
        modelItem = item as unknown as OrganizationItemClientStateType;
        // Render organization details
        return (
          <div key={item.clientId} id={item.clientId}>
            <h3>Organization</h3>
            <p>{modelItem.name}</p>
          </div>
        );
      case "role":
        modelItem = item as unknown as RoleItemClientStateType;
        // Render role details
        return (
          <div key={item.clientId}>
            <h4>Role</h4>
            <p>{modelItem.name}</p>
          </div>
        );
      case "achievement":
        modelItem = item as unknown as AchievementItemClientStateType;
        // Render achievement as a bullet point
        return (
          <li key={item.clientId} id={item.clientId}>
            {modelItem.content}
          </li>
        );
      default:
        return null;
    }
  };
  return !item.descendantModel ? null : (
    <>
      {renderItemBasedOnLevel(item)}
      {item.descendants?.map((descendant) => <ItemDescendantScaffold key={descendant.clientId} item={descendant} />)}
    </>
  );
};

interface ItemDescendantClientContextProps extends ItemDescendantListContextProps {}
function ItemDescendantClientContext(props: ItemDescendantClientContextProps) {
  const [isStoreInitialized, setStoreInitialized] = useState(false);

  const globalStoreName = useStoreName();
  const store = useItemDescendantStore(globalStoreName);
  const rootState = store((state) => state);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const { serverState } = props;

  useEffect(() => {
    if (updateStoreWithServerData && !isStoreInitialized) {
      console.log(`ItemDescendantClientContext: useEffect with serverState:`, serverState);
      updateStoreWithServerData(serverState);
      setStoreInitialized(true);
    }
  }, [serverState, isStoreInitialized, updateStoreWithServerData]);

  return !isStoreInitialized ? null : (
    <div className="space-y-1">
      <ItemDescendantScaffold item={{ ...rootState }} />
    </div>
  );
}

export default function ItemDescendantScaffoldClientComponent(props: ItemDescendantListContextProps) {
  const { serverState, resumeAction } = props;

  const itemModel = serverState.itemModel;
  const parentClientId = getItemId(getParentModel(itemModel));
  const clientId = getItemId(itemModel!);

  const parentId = serverState.parentId;
  const id = serverState.id;

  const storeVersion = 1; // Or any logic to determine the version
  const logUpdateFromServer = process.env.NODE_ENV === "development";

  return (
    <ResumeActionProvider resumeAction={resumeAction}>
      <StoreNameProvider storeName={`${itemModel}`}>
        <ItemDescendantStoreProvider
          configs={[{ itemModel, parentClientId, clientId, parentId, id, storeVersion, logUpdateFromServer }]}
        >
          <ItemDescendantClientContext {...props} />
        </ItemDescendantStoreProvider>
      </StoreNameProvider>
    </ResumeActionProvider>
  );
}
