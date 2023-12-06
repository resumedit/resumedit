// @/app/(authenticated)/item-resume/page.tsx

"use server";

import NestedParentItemListServerComponent from "@/components/item/NestedParentItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType } from "@/schemas/id";
import { ResumeActionType } from "@/types/resume";
import { Suspense } from "react";

export interface ResumeActionPageProps {
  params: { id: IdSchemaType; action: ResumeActionType };
}

export default async function ResumeActionPage({ params: { id, action } }: ResumeActionPageProps) {
  return (
    <Suspense fallback={<ParentItemListSkeleton />}>
      <NestedParentItemListServerComponent storeName="resume" resumeAction={action} id={id} />
    </Suspense>
  );
}

function ParentItemListSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
