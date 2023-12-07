// @/app/(marketing)/(home)/WelcomeMessage.tsx

import { AuthenticatedContentLayoutChildrenProps } from "@/app/(authenticated)/AuthenticatedContentLayout";
import TryAppButton from "@/components/layout/main/TryAppButton";
import { siteConfig } from "@/config/site";

export interface WelcomeMessageProps extends AuthenticatedContentLayoutChildrenProps {}

export default async function WelcomeMessage({ user }: WelcomeMessageProps) {
  return (
    <div className="mx-auto text-center">
      <div
        className="text-gradient flex justify-center bg-gradient-to-r from-green-800 to-indigo-900
        bg-clip-text
        pb-10
        text-6xl font-bold
        text-transparent dark:from-blue-500
        dark:to-slate-400
        md:px-20"
      >
        {siteConfig.description}
      </div>

      <p
        className="md-10 bg-gradient-to-r from-black
        to-gray-400
        bg-clip-text text-lg
        font-bold text-transparent
        dark:from-white
        dark:to-gray-300
        md:text-xl"
      >
        Import your resume and tailor it with AI to get the job of your dreams!
      </p>
      <div className="flex justify-center gap-4 pt-10">
        <TryAppButton user={user}></TryAppButton>

        {/* <button className="bg-gray-600 text-white px-10 py-4 rounded-md text-lg font-bold">
            Learn more
          </button> */}
      </div>
    </div>
  );
}
