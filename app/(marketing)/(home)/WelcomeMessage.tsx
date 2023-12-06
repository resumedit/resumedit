// @/app/(marketing)/(home)/WelcomeMessage.tsx

import { getCurrentUserOrNull } from "@/actions/user";
import { SignupNavigation } from "@/app/(layout)/(navigation)/NavigationActionButtons";
import { siteConfig } from "@/config/site";
import { User as PrismaUser } from "@prisma/client";
import { ActionButton } from "@/components/custom/ActionButton";

const WelcomeMessage = async ({ user }: { user: PrismaUser | undefined | null }) => {
  const currentUser = user === undefined ? await getCurrentUserOrNull() : user;
  const signUpMessage = `Sign up for ${siteConfig.name}`;
  const openDashboardMessage = `Enter ${siteConfig.name}`;
  return (
    <div className="mx-auto text-center">
      <div
        className="text-6xl flex justify-center font-bold md:px-20 pb-10
        text-gradient
        bg-gradient-to-r
        from-green-800 dark:from-blue-500
        to-indigo-900 dark:to-slate-400
        bg-clip-text
        text-transparent"
      >
        Your resume, revised
      </div>

      <p
        className="text-lg md:text-xl md-10
        bg-gradient-to-r
        from-black dark:from-white
        to-gray-400 dark:to-gray-300
        bg-clip-text
        text-transparent
        font-bold"
      >
        Import your resume and revise it to get the job of your dreams!
      </p>
      <div className="flex gap-4 justify-center pt-10">
        <ActionButton
          variant="default"
          className="text-background dark:hover:text-foreground
        bg-gradient-to-r
        from-green-800 hover:from-green-600 dark:from-blue-200 hover:dark:from-blue-300
        to-indigo-900 hover:to-indigo-700 dark:to-slate-300 hover:dark:to-slate-400
        "
        >
          <SignupNavigation authenticated={openDashboardMessage} user={currentUser}>
            {signUpMessage}
          </SignupNavigation>
        </ActionButton>

        {/* <button className="bg-gray-600 text-white px-10 py-4 rounded-md text-lg font-bold">
        Learn more
      </button> */}
      </div>
    </div>
  );
};

export default WelcomeMessage;
