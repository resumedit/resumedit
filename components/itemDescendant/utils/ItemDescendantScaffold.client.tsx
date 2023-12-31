// @/components/itemDescendant/ItemDescendantScaffold.client.tsx

"use client";

import { ItemDescendantStoreProvider, useItemDescendantStore } from "@/contexts/ItemDescendantStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { getClientId } from "@/schemas/id";
import { ItemDescendantClientStateType } from "@/schemas/itemDescendant";
import { getParentModel } from "@/types/itemDescendant";

import { AchievementItemClientStateType } from "@/schemas/achievement";
import { OrganizationItemClientStateType } from "@/schemas/organization";
import { ResumeItemClientStateType } from "@/schemas/resume";
import { RoleItemClientStateType } from "@/schemas/role";
import { UserItemClientStateType } from "@/schemas/user";
import { useEffect, useState } from "react";
import { ItemDescendantListContextProps } from "../ItemDescendantList.client";

const ItemDescendantScaffold = ({ item }: { item: ItemDescendantClientStateType }) => {
  const renderItemBasedOnLevel = (item: ItemDescendantClientStateType) => {
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
      // window.consoleLog(`ItemDescendantClientContext: useEffect with serverState:`, serverState);
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
  const parentClientId = getClientId(getParentModel(itemModel));
  const clientId = getClientId(itemModel!);

  const parentId = serverState.parentId;
  const id = serverState.id;

  const storeVersion = 1; // Or any logic to determine the version

  return (
    <ResumeActionProvider resumeAction={resumeAction}>
      <StoreNameProvider storeName={`${itemModel}`}>
        <ItemDescendantStoreProvider configs={[{ itemModel, parentClientId, clientId, parentId, id, storeVersion }]}>
          <ItemDescendantClientContext {...props} />
        </ItemDescendantStoreProvider>
      </StoreNameProvider>
    </ResumeActionProvider>
  );
}
