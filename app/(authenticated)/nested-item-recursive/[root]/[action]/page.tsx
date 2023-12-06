// @/app/(authenticated)/nestedItemRecursive/[root]/[action]/page.tsx

"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import NestedItemRecursiveServerComponent from "@/components/nestedItemRecursive/NestedItemRecursive.server";
import { Skeleton } from "@/components/ui/skeleton";
import { NestedItemModelNameType } from "@/types/nestedItem";
import { ResumeActionType } from "@/types/resume";
import { Suspense } from "react";

export interface NestedItemRecursiveActionPageProps {
  params: { root: NestedItemModelNameType; action: ResumeActionType };
}

export default async function NestedItemRecursiveActionPage({
  params: { root, action },
}: NestedItemRecursiveActionPageProps) {
  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<NestedItemActionSkeleton />}>
      <NestedItemRecursiveServerComponent rootItemModel={root} parentId={userId} resumeAction={action} />
    </Suspense>
  );
}

function NestedItemActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
