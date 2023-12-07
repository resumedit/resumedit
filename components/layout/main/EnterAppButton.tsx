// @/components/layout/navigation/EnterAppButton.tsx

"use server";

import { SignupNavigation } from "../navigation/SignupNavigation";
import { AuthenticatedContentLayoutChildrenProps } from "@/app/(authenticated)/AuthenticatedContentLayout";
import { siteConfig } from "@/config/site";
import EnterActionButton from "../../custom/EnterActionButton";

export interface EnterAppButtonProps extends AuthenticatedContentLayoutChildrenProps {}
export default async function EnterAppButton({ user }: EnterAppButtonProps) {
  const signUpMessage = `Sign up for ${siteConfig.name}`;
  const openDashboardMessage = `Enter ${siteConfig.name}`;

  return (
    <EnterActionButton>
      <SignupNavigation signedInChildren={openDashboardMessage} user={user}>
        {signUpMessage}
      </SignupNavigation>
    </EnterActionButton>
  );
}
