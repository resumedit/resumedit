import { getCurrentUserOrNull } from "@/actions/user";
import { User as PrismaUser } from "@prisma/client";
import WelcomeMessage from "./WelcomeMessage";

const HeroSection = async ({ user }: { user?: PrismaUser }) => {
  const currentUser = user === undefined ? await getCurrentUserOrNull() : user;
  return (
    <section className="md:py-20 py-10 bg-gradient-to-r from gray-00 to-gray-200 spacey-10">
      <WelcomeMessage user={currentUser} />
    </section>
  );
};

export default HeroSection;
