// @/components/item/ParentItemList.server.tsx

"use server";

import { getItemList, getParentItemList } from "@/actions/parentItemList";
import { getCurrentUserOrNull } from "@/actions/user";
import { ParentItemListType, ParentItemModelAccessor } from "@/types/parentItemList";
import { ItemServerStateType } from "@/types/item";
import ParentItemListClientComponent from "./ParentItemList.client";

interface Props {
  storeName: keyof ParentItemModelAccessor;
}
const ParentItemListServerComponent = async (props: Props) => {
  let serverState;
  const user = await getCurrentUserOrNull();
  if (user) {
    const userId = user.id;

    let parentId;

    if (props.storeName === "resume") {
      // Parent of resume is user
      parentId = userId;
    } else {
      const resumeList = await getItemList("resume", userId);
      if (resumeList?.length > 0) {
        const resumeId = resumeList[0].id;
        if (props.storeName === "organization") {
          // Parent of organization is resume
          parentId = resumeId;
        } else {
          const organizationList = await getItemList("organization", resumeId);
          if (organizationList?.length > 0) {
            const organizationId = organizationList[0].id;
            if (props.storeName === "role") {
              // Parent of role is organization
              parentId = organizationId;
            } else {
              const roleList = await getItemList("role", organizationId);
              if (roleList?.length > 0) {
                const roleId = roleList[0].id;
                if (props.storeName === "achievement") {
                  // Parent of achievement is role
                  parentId = roleId;
                } else {
                  throw Error(`Invalid storeName=${props.storeName}`);
                }
              }
            }
          }
        }
      }
    }
    if (parentId) {
      const serverItemList = await getParentItemList(props.storeName, parentId);
      serverState = {
        ...serverItemList,
      } as ParentItemListType<ItemServerStateType>;

      console.log(`ItemList.server: serverState:`, serverState);
    } else {
      throw Error(`No entries for parent of storeName=${props.storeName} found`);
    }
  }

  return !serverState ? null : (
    <div className="space-y-8">
      <ParentItemListClientComponent storeName={props.storeName} serverState={serverState} />
    </div>
  );
};

export default ParentItemListServerComponent;
