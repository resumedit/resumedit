// @/app/(authenticated)/item-resume/page.tsx

"use server";

import NestedParentItemListServerComponent from "@/components/parentItemList/NestedParentItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType, isValidItemId } from "@/schemas/id";
import { ResumeActionType } from "@/types/resume";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export interface ResumeActionPageProps {
  params: { id: IdSchemaType; action: ResumeActionType };
}

export default async function ResumeActionPage({ params: { id, action } }: ResumeActionPageProps) {
  const idIsValid = isValidItemId(id);
  return !idIsValid ? (
    notFound()
  ) : (
    <Suspense fallback={<ParentItemListSkeleton />}>
      <NestedParentItemListServerComponent storeName="resume" resumeAction={action} id={id} />
    </Suspense>
  );
}

function ParentItemListSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
