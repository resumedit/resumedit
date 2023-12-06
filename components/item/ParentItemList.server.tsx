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
        if (props.storeName === "organization") {
          // Parent of organization is resume
          parentId = resumeList[0].id;
        } else {
          const organizationList = await getItemList("organization", userId);
          if (organizationList?.length > 0) {
            if (props.storeName === "role") {
              // Parent of role is organization
              parentId = organizationList[0].id;
            } else {
              const roleList = await getItemList("role", userId);
              if (roleList?.length > 0) {
                if (props.storeName === "achievement") {
                  // Parent of achievement is role
                  parentId = roleList[0].id;
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
