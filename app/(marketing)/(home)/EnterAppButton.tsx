// @/app/(marketing)/(home)/EnterAppButton.tsx

"use server";

import { getCurrentUserOrNull } from "@/actions/user";
import { SignupNavigation } from "@/app/(layout)/(navigation)/NavigationActionButtons";
import { siteConfig } from "@/config/site";
import { User as PrismaUser } from "@prisma/client";
import EnterActionButton from "./EnterActionButton";

export default async function EnterAppButton({ user }: { user: PrismaUser | undefined | null }) {
  const currentUser = user === undefined ? await getCurrentUserOrNull() : user;
  const signUpMessage = `Sign up for ${siteConfig.name}`;
  const openDashboardMessage = `Enter ${siteConfig.name}`;

  return (
    <EnterActionButton>
      <SignupNavigation authenticated={openDashboardMessage} user={currentUser}>
        {signUpMessage}
      </SignupNavigation>
    </EnterActionButton>
  );
}
