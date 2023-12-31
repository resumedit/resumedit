import { Logo } from "@/components/custom/Logo";
import Link from "next/link";
import { AuthenticatedContentLayoutChildrenProps } from "../../../app/(authenticated)/AuthenticatedContentLayout";
import NavigationActionButtons from "./NavigationActionButtons";
import { NavigationMenuBar } from "./NavigationMenuBar";

export interface NavbarProps extends AuthenticatedContentLayoutChildrenProps {}
export default function Navbar({ user }: NavbarProps) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-4 pb-4 pt-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
        <Link href="/">
          <Logo className="mr-8" />
        </Link>
        <NavigationMenuBar />
      </div>
      <NavigationActionButtons user={user} />
    </div>
  );
}
