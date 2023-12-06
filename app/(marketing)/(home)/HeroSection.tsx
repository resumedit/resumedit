// @/app/(marketing)/(home)/HeroSection.tsx

import { getCurrentUserOrNull } from "@/actions/user";
import { User as PrismaUser } from "@prisma/client";
import WelcomeMessage from "./WelcomeMessage";

const HeroSection = async ({ user }: { user?: PrismaUser }) => {
  const currentUser = user === undefined ? await getCurrentUserOrNull() : user;
  return (
    <section className="from gray-00 spacey-10 bg-gradient-to-r to-gray-200 py-10 md:py-20">
      <WelcomeMessage user={currentUser} />
    </section>
  );
};

export default HeroSection;
