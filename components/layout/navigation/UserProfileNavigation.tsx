import { Button } from "@/components/ui/button";
import { User as PrismaUser } from "@prisma/client";
import Link from "next/link";
import UserProfileButton from "./UserProfileButton";

export function UserProfileNavigation({ user }: { user: PrismaUser | null | undefined }) {
  return user ? <UserProfileButton /> : <SigninButton />;
}
function SigninButton() {
  return (
    <Button variant="secondary">
      <Link href="/sign-in">Sign in</Link>
    </Button>
  );
}
