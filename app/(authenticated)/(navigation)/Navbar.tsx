import ActionButtons from "@/app/(layout)/(navigation)/action-buttons";
import { MenuBar } from "@/app/(layout)/(navigation)/navigation-menu";
import { Logo } from "@/components/custom/Logo";
import { User as PrismaUser } from "@prisma/client";
import Link from "next/link";

const Navbar = ({ user }: { user?: PrismaUser }) => {
  return (
    <div className="h-40 flex justify-between items-center border-b">
      <Link href="/">
        <Logo />
      </Link>
      <MenuBar />
      <ActionButtons user={user} />
    </div>
  );
};

export default Navbar;
