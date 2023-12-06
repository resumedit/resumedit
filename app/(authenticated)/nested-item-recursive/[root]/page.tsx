// @/app/(authenticated)/nestedItemRecursive/[root]/page.tsx

"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import NestedItemRecursiveServerComponent from "@/components/nestedItemRecursive/NestedItemRecursive.server";
import { Skeleton } from "@/components/ui/skeleton";
import { NestedItemModelNameType } from "@/types/nestedItem";
import { Suspense } from "react";

export interface NestedItemRecursivePageProps {
  params: { root: NestedItemModelNameType };
}

export default async function NestedItemRecursivePage({ params: { root } }: NestedItemRecursivePageProps) {
  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<NestedItemSkeleton />}>
      <NestedItemRecursiveServerComponent rootItemModel={root} parentId={userId} />
    </Suspense>
  );
}

function NestedItemSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
