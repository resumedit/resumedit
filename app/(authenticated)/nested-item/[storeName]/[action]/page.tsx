// @/app/(authenticated)/nestedItem/[storeName]/[action]/page.tsx

"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import NestedItemServerComponent from "@/components/nestedItem/NestedItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { NestedItemStoreNameType } from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import { Suspense } from "react";

export interface NestedItemActionPageProps {
  params: { storeName: NestedItemStoreNameType; action: ResumeActionType };
}

export default async function NestedItemActionPage({ params: { storeName, action } }: NestedItemActionPageProps) {
  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<NestedItemSkeleton />}>
      <NestedItemServerComponent storeName={storeName} parentId={userId} resumeAction={action} />
    </Suspense>
  );
}

function NestedItemSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
