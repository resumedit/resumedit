// @/app/(marketing)/(home)/WelcomeMessage.tsx

import { User as PrismaUser } from "@prisma/client";
import EnterAppButton from "./EnterAppButton";

export default async function WelcomeMessage({ user }: { user: PrismaUser | undefined | null }) {
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
        <EnterAppButton user={user}></EnterAppButton>

        {/* <button className="bg-gray-600 text-white px-10 py-4 rounded-md text-lg font-bold">
            Learn more
          </button> */}
      </div>
    </div>
  );
}
