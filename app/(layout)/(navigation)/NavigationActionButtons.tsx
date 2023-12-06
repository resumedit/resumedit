import { getCurrentUserOrNull as getCurrentUserOrNull } from "@/actions/user";
import { ActionButton } from "@/components/custom/ActionButton";
import SettingsSheet from "@/components/settings/SettingsSheet";
// import StyledLink from "@/components/StyledLink";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { User as PrismaUser } from "@prisma/client";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
// import { HiOutlineMenuAlt2 } from "react-icons/hi";

const NavigationActionButtons = async ({ user }: { user: PrismaUser | undefined | null }) => {
  const currentUser = user === undefined ? await getCurrentUserOrNull() : user;
  return (
    <div className="flex gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-4 items-center">
        <SettingsSheet />
      </div>
      <Suspense fallback={<SignupNavigationSkeleton />}>
        <SignupNavigation user={currentUser}>
          <ActionButton variant="default">Sign up</ActionButton>
        </SignupNavigation>
      </Suspense>
      <div className="flex gap-4 items-center">
        <Suspense fallback={<UserProfileNavigationSkeleton />}>
          <UserProfileNavigation user={currentUser} />
        </Suspense>
      </div>
      {/* <div className="md:hidden">
        <Sheet>
          <SheetTrigger>{<HiOutlineMenuAlt2 />}</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetDescription>
                <div className="flex flex-col space-y-4 items-start w-full text-lg text-black mt-10">
                  <DashboardNavigation authenticated="Sign up">Dashboard</DashboardNavigation>
                  <Link href="/">Get Started</Link>
                  <Link href="/">Pricing</Link>
                  <Link href="/">Contact</Link>
                  <StyledLink href="/about">About</StyledLink>
                </div>
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div> */}
    </div>
  );
};

export default NavigationActionButtons;

const SignupNavigationSkeleton = async () => {
  return <Skeleton className="h-[32px] pl-8 w-[32px]" />;
};

export const SignupNavigation = async ({
  children,
  authenticated,
  user,
}: {
  children: ReactNode;
  authenticated?: ReactNode;
  user: PrismaUser | undefined | null;
}): Promise<React.ReactElement | null> => {
  return user ? (
    authenticated ? (
      <Link href="/resume">{authenticated}</Link>
    ) : null
  ) : (
    <Link href="/sign-up">{children}</Link>
  );
};

const UserProfileNavigationSkeleton = async () => {
  return <Skeleton className="h-[32px] pl-8 w-[32px]" />;
};

export const UserProfileNavigation = async ({
  user,
}: {
  user: PrismaUser | undefined | null;
}): Promise<React.ReactElement> => {
  return user ? (
    <SignedIn>
      <UserButton userProfileMode="navigation" afterSignOutUrl="/" />
    </SignedIn>
  ) : (
    <SignedOut>
      <ActionButton asChild variant="outline">
        <SignInButton afterSignInUrl="/resume" />
      </ActionButton>
    </SignedOut>
  );
};
