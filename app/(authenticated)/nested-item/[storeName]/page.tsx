"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import NestedItemServerComponent from "@/components/nestedItem/NestedItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { NestedItemModelNameType } from "@/types/nestedItem";
import { Suspense } from "react";

export interface NestedItemPageProps {
  params: { storeName: NestedItemModelNameType };
}

export default async function NestedItemPage({ params: { storeName } }: NestedItemPageProps) {
  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<NestedItemSkeleton />}>
      <NestedItemServerComponent storeName={storeName} parentId={userId} />
    </Suspense>
  );
}

function NestedItemSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
