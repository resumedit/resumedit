"use server";

import ParentItemListServerComponent from "@/components/item/ParentItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

const ParentItemListPage = async () => {
  return (
    <Suspense fallback={<ParentItemListSkeleton />}>
      <ParentItemListServerComponent storeName="role" />
    </Suspense>
  );
};

function ParentItemListSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}

export default ParentItemListPage;
