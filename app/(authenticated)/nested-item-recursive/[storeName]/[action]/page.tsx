// @/app/(authenticated)/nestedItem/[storeName]/[action]/page.tsx

"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import NestedItemRecursiveServerComponent from "@/components/nestedItemRecursive/NestedItemRecursive.server";
import { Skeleton } from "@/components/ui/skeleton";
import { NestedItemStoreNameType } from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import { Suspense } from "react";

export interface NestedItemRecursiveActionPageProps {
  params: { storeName: NestedItemStoreNameType; action: ResumeActionType };
}

export default async function NestedItemRecursiveActionPage({
  params: { storeName, action },
}: NestedItemRecursiveActionPageProps) {
  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<NestedItemActionSkeleton />}>
      <NestedItemRecursiveServerComponent storeName={storeName} parentId={userId} resumeAction={action} />
    </Suspense>
  );
}

function NestedItemActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
