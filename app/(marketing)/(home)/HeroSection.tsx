// @/app/(marketing)/(home)/HeroSection.tsx

import { AuthenticatedContentLayoutChildrenProps } from "@/app/(authenticated)/AuthenticatedContentLayout";
import WelcomeMessage from "./WelcomeMessage";

export interface HeroSectionProps extends AuthenticatedContentLayoutChildrenProps {}
export default async function HeroSection({ user }: HeroSectionProps) {
  return (
    <section className="from gray-00 spacey-10 bg-gradient-to-r to-gray-200 py-10 md:py-20">
      <WelcomeMessage user={user} />
    </section>
  );
}
