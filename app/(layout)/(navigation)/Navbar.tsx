import { Logo } from "@/components/custom/Logo";
import { User as PrismaUser } from "@prisma/client";
import Link from "next/link";
import NavigationActionButtons from "./NavigationActionButtons";
import { NavigationMenuBar } from "./NavigationMenuBar";

const Navbar = ({ user }: { user?: PrismaUser }) => {
  return (
    <div className="pt-8 pb-4 flex flex-wrap gap-x-4 gap-y-4 justify-between">
      <div className="flex flex-wrap gap-x-4 gap-y-4 items-center">
        <Link href="/">
          <Logo className="mr-8" />
        </Link>
        <NavigationMenuBar />
      </div>
      <NavigationActionButtons user={user} />
    </div>
  );
};

export default Navbar;
