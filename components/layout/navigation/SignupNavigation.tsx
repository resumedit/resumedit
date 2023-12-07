import { Button } from "@/components/ui/button";
import { appNavigation } from "@/config/appNavigation";
import { User as PrismaUser } from "@prisma/client";
import Link from "next/link";
import { ReactNode } from "react";

export function SignupNavigation({ user, signedInChildren, children }: SignupNavigationProps) {
  return user ? (
    <SignupNavigationWithUser signedInChildren={signedInChildren} />
  ) : (
    <SignupNavigationWithoutUser>{children}</SignupNavigationWithoutUser>
  );
}
function SignupNavigationWithUser({ signedInChildren }: { signedInChildren?: ReactNode }) {
  return signedInChildren ? <Link href={appNavigation.enterApp.href}>{signedInChildren}</Link> : null;
}
function SignupNavigationWithoutUser({ children }: { children?: ReactNode }) {
  return children ? (
    <Link href={appNavigation.signUp.href}>{children}</Link>
  ) : (
    <Button variant="default">
      <Link href={appNavigation.signUp.href}>{appNavigation.signUp.title}</Link>
    </Button>
  );
}
interface SignupNavigationProps {
  user?: PrismaUser | null;
  signedInChildren?: ReactNode;
  children?: ReactNode;
}
