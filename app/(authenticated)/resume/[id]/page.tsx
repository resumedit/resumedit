// @/app/(authenticated)/item-resume/page.tsx

"use server";

import NestedParentItemListServerComponent from "@/components/item/NestedParentItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType } from "@/schemas/id";
import { Suspense } from "react";

export interface ResumeViewPageProps {
  params: { id: IdSchemaType };
}

export default async function ResumeViewPage({ params: { id } }: ResumeViewPageProps) {
  return (
    <Suspense fallback={<ParentItemListSkeleton />}>
      <NestedParentItemListServerComponent storeName="resume" resumeAction={"view"} id={id} />
    </Suspense>
  );
}

function ParentItemListSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
