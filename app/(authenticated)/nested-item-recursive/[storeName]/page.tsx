"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import NestedItemRecursiveServerComponent from "@/components/nestedItemRecursive/NestedItemRecursive.server";
import { Skeleton } from "@/components/ui/skeleton";
import { NestedItemStoreNameType } from "@/types/nestedItem";
import { Suspense } from "react";

export interface NestedItemRecursivePageProps {
  params: { storeName: NestedItemStoreNameType };
}

export default async function NestedItemRecursivePage({ params: { storeName } }: NestedItemRecursivePageProps) {
  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<NestedItemSkeleton />}>
      <NestedItemRecursiveServerComponent storeName={storeName} parentId={userId} />
    </Suspense>
  );
}

function NestedItemSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
