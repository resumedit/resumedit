import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function UserProfileButton() {
  return (
    <Link href="/user-profile">
      <div className={"relative h-[32px] w-[32px] rounded-full bg-muted-foreground"}>
        <div className="absolute left-0 top-0">
          <UserButton userProfileMode="navigation" afterSignOutUrl="/" />
        </div>
      </div>
    </Link>
  );
}
