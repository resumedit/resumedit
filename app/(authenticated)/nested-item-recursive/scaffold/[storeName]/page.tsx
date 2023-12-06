"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import NestedItemRecursiveScaffoldServerComponent from "@/components/nestedItemRecursive/NestedItemRecursiveScaffold.server";
import { Skeleton } from "@/components/ui/skeleton";
import { NestedItemStoreNameType } from "@/types/nestedItem";
import { Suspense } from "react";

export interface NestedItemPageProps {
  params: { storeName: NestedItemStoreNameType };
}

export default async function NestedItemRecursiveScaffoldPage({ params: { storeName } }: NestedItemPageProps) {
  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<NestedItemSkeleton />}>
      <NestedItemRecursiveScaffoldServerComponent storeName={storeName} parentId={userId} />
    </Suspense>
  );
}

function NestedItemSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
