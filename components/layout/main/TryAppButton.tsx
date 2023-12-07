// @/components/layout/navigation/TryAppButton.tsx

"use server";

import { AuthenticatedContentLayoutChildrenProps } from "@/app/(authenticated)/AuthenticatedContentLayout";
import { appNavigation } from "@/config/appNavigation";
import EnterActionButton from "../../custom/EnterActionButton";
import { TryAppNavigation } from "./TryAppNavigation";

export interface TryAppButtonProps extends AuthenticatedContentLayoutChildrenProps {}
export default async function TryAppButton({ user }: TryAppButtonProps) {
  return (
    <EnterActionButton>
      <TryAppNavigation signedInChildren={appNavigation.enterApp.title} user={user}>
        {appNavigation.tryApp.title}
      </TryAppNavigation>
    </EnterActionButton>
  );
}
