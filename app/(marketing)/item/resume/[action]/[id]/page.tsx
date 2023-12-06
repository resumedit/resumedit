// @/app/(authenticated)/item-resume/page.tsx

"use server";

import ParentItemListServerComponent from "@/components/item/ParentItemList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType } from "@/schemas/id";
import { Suspense } from "react";

export type ResumePageAction = "view" | "edit";

export interface ResumePageProps {
  params: { action: ResumePageAction; id: IdSchemaType };
}

export default async function ResumePage({ params: { action, id } }: ResumePageProps) {
  return (
    <Suspense fallback={<ParentItemListSkeleton />}>
      <ParentItemListServerComponent storeName="resume" action={action} id={id} />
    </Suspense>
  );
}

function ParentItemListSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
