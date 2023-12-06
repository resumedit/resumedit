import NavigationActionButtons from "@/app/(layout)/(navigation)/NavigationActionButtons";
import { NavigationMenuBar } from "@/app/(layout)/(navigation)/NavigationMenuBar";
import { Logo } from "@/components/custom/Logo";
import { User as PrismaUser } from "@prisma/client";
import Link from "next/link";

const Navbar = ({ user }: { user?: PrismaUser }) => {
  return (
    <div className="h-40 flex justify-between items-center border-b">
      <Link href="/">
        <Logo />
      </Link>
      <NavigationMenuBar />
      <NavigationActionButtons user={user} />
    </div>
  );
};

export default Navbar;
