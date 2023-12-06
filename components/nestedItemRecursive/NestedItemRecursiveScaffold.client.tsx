// @/components/nestedItemRecursive/NestedItemRecursiveScaffold.client.tsx

"use client";

import {
  NestedItemRecursiveStoreProvider,
  useNestedItemRecursiveStore,
} from "@/contexts/NestedItemRecursiveStoreContext";
import { ResumeActionProvider } from "@/contexts/ResumeActionContext";
import { StoreNameProvider, useStoreName } from "@/contexts/StoreNameContext";
import { getItemId } from "@/schemas/id";
import { AchievementClientStateType } from "@/types/achievement";
import {
  NestedItemListType,
  NestedItemServerStateType,
  NestedItemModelNameType,
  getDescendantModel,
} from "@/types/nestedItem";
import { OrganizationClientStateType } from "@/types/organization";
import { ResumeActionType, ResumeClientStateType } from "@/types/resume";
import { RoleClientStateType } from "@/types/role";
import { useEffect } from "react";
import { NestedItemServerComponentProps } from "../nestedItem/NestedItemList.server";

interface NestedItemRecursiveScaffoldProps {
  item: NestedItemListType<NestedItemServerStateType, NestedItemServerStateType>;
  level: NestedItemModelNameType;
}

const NestedItemRecursiveScaffold = ({ item, level }: NestedItemRecursiveScaffoldProps) => {
  const renderItemBasedOnLevel = (item: NestedItemServerStateType, level: NestedItemModelNameType) => {
    switch (level) {
      case "resume":
        // Render resume details
        // return <RenderResumeDetails item={item} />;
        return (
          <>
            <h2>Resume</h2>
            <p>{(item as ResumeClientStateType).name}</p>
          </>
        );
      case "organization":
        // Render organization details
        // return <RenderOrganizationDetails item={item} />;
        return (
          <>
            <h3>Organization</h3>
            <p>{(item as OrganizationClientStateType).name}</p>
          </>
        );
      case "role":
        // Render role details
        // return <RenderRoleDetails item={item} />;
        return (
          <>
            <h4>Role</h4>
            <p>{(item as RoleClientStateType).name}</p>
          </>
        );
      case "achievement":
        // Render achievement as a bullet point
        return <li>{(item as AchievementClientStateType).content}</li>;
      default:
        return null;
    }
  };
  const descendantModel = getDescendantModel(level);
  return !descendantModel ? null : (
    <div>
      {renderItemBasedOnLevel(item, level)}
      {item.descendants?.map((descendant) => (
        <NestedItemRecursiveScaffold key={descendant.id} item={descendant} level={descendantModel} />
      ))}
    </div>
  );
};

export interface NestedItemRecursiveClientContextProps extends NestedItemRecursiveClientComponentProps {}

const NestedItemRecursiveClientContext = (props: NestedItemRecursiveClientContextProps) => {
  const globalStoreName = useStoreName();
  const storeName = props.storeName || globalStoreName;

  const store = useNestedItemRecursiveStore(storeName);
  const updateStoreWithServerData = store((state) => state.updateStoreWithServerData);

  const { serverState } = props;

  useEffect(() => {
    if (updateStoreWithServerData) {
      // console.log(`NestedItemRecursiveClientContext: useEffect with serverState:`, serverState);
      updateStoreWithServerData(serverState);
    }
  }, [serverState, updateStoreWithServerData]);

  return (
    <div className="space-y-1">
      <NestedItemRecursiveScaffold item={{ ...serverState }} level={serverState.itemModel} />
    </div>
  );
};

export interface NestedItemRecursiveClientComponentProps extends Omit<NestedItemServerComponentProps, "parentId"> {
  resumeAction?: ResumeActionType;
  serverState: NestedItemListType<NestedItemServerStateType, NestedItemServerStateType>;
}

const NestedItemRecursiveScaffoldClientComponent = (props: NestedItemRecursiveClientComponentProps) => {
  const itemModel = props.serverState.itemModel;

  const storeVersion = 1;
  const storeName = `${itemModel}-nested-item-recursive-scaffold.devel.resumedit.local`;
  const resumeAction = props?.resumeAction ? props.resumeAction : "view";

  const parentClientId = getItemId();
  const clientId = getItemId();
  const parentId = props.serverState.parentId;
  const id = props.serverState.id;

  return !parentId ? null : !id ? (
    <span>Please create a resume first</span>
  ) : (
    <ResumeActionProvider resumeAction={resumeAction}>
      <StoreNameProvider storeName={props.storeName}>
        <NestedItemRecursiveStoreProvider
          configs={[{ itemModel, parentClientId, clientId, parentId, id, storeVersion, storeName }]}
        >
          <NestedItemRecursiveClientContext {...{ ...props, resumeAction: resumeAction }} />
        </NestedItemRecursiveStoreProvider>
      </StoreNameProvider>
    </ResumeActionProvider>
  );
};

export default NestedItemRecursiveScaffoldClientComponent;
