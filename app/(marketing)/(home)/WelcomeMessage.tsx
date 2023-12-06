// @/app/(marketing)/(home)/WelcomeMessage.tsx

import { User as PrismaUser } from "@prisma/client";
import EnterAppButton from "./EnterAppButton";

export default async function WelcomeMessage({ user }: { user: PrismaUser | undefined | null }) {
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
        Your resume, revised
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
        Import your resume and revise it to get the job of your dreams!
      </p>
      <div className="flex justify-center gap-4 pt-10">
        <EnterAppButton user={user}></EnterAppButton>

        {/* <button className="bg-gray-600 text-white px-10 py-4 rounded-md text-lg font-bold">
            Learn more
          </button> */}
      </div>
    </div>
  );
}
