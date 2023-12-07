import { Button } from "@/components/ui/button";
import { appNavigation } from "@/config/appNavigation";
import { User as PrismaUser } from "@prisma/client";
import Link from "next/link";
import { ReactNode } from "react";

export function TryAppNavigation({ user, signedInChildren, children }: TryAppNavigationProps) {
  return user ? (
    <TryAppNavigationWithUser signedInChildren={signedInChildren} />
  ) : (
    <TryAppNavigationWithoutUser>{children}</TryAppNavigationWithoutUser>
  );
}
function TryAppNavigationWithUser({ signedInChildren }: { signedInChildren?: ReactNode }) {
  return signedInChildren ? <Link href={appNavigation.enterApp.href}>{signedInChildren}</Link> : null;
}
function TryAppNavigationWithoutUser({ children }: { children?: ReactNode }) {
  return children ? (
    <Link href={appNavigation.tryApp.href}>{children}</Link>
  ) : (
    <Button variant="default">
      <Link href={appNavigation.tryApp.href}>Sign up</Link>
    </Button>
  );
}
interface TryAppNavigationProps {
  user?: PrismaUser | null;
  signedInChildren?: ReactNode;
  children?: ReactNode;
}
