"use server";

import ParentItemListServerComponent from "@/components/parentItemList/ParentItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { ParentItemListStoreNameType } from "@/types/parentItemList";
import { Suspense } from "react";

export interface ParentItemListPageProps {
  params: { storeName: ParentItemListStoreNameType };
}

export default async function ParentItemListPage({ params: { storeName } }: ParentItemListPageProps) {
  return (
    <Suspense fallback={<ParentItemListSkeleton />}>
      <ParentItemListServerComponent storeName={storeName} />
    </Suspense>
  );
}

function ParentItemListSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
