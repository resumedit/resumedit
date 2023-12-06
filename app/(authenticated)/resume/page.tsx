// @/app/(authenticated)/item-resume/page.tsx

"use server";

import ParentItemListServerComponent from "@/components/parentItemList/ParentItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

const UserResumeListPage = async () => {
  return (
    <Suspense fallback={<ParentItemListSkeleton />}>
      <ParentItemListServerComponent storeName="resume" />
    </Suspense>
  );
};

function ParentItemListSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}

export default UserResumeListPage;
