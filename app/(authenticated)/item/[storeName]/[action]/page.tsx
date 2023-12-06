// @/app/(authenticated)/item/[storeName]/[action]/page.tsx

"use server";

import ParentItemListServerComponent from "@/components/item/ParentItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { ParentItemListStoreNameType } from "@/types/parentItemList";
import { ResumeActionType } from "@/types/resume";
import { Suspense } from "react";

export interface ParentItemListActionPageProps {
  params: { storeName: ParentItemListStoreNameType; action: ResumeActionType };
}

export default async function ParentItemListActionPage({
  params: { storeName, action },
}: ParentItemListActionPageProps) {
  return (
    <Suspense fallback={<ParentItemListSkeleton />}>
      <ParentItemListServerComponent storeName={storeName} resumeAction={action} />
    </Suspense>
  );
}

function ParentItemListSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
