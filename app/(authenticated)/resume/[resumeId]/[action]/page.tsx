// @/app/(authenticated)/resume/[resumeId]/[action]/page.tsx

"use server";

import ItemDescendantServerComponent from "@/components/itemDescendant/ItemDescendant.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType } from "@/schemas/id";
import { ResumeActionType } from "@/types/resume";
import { Suspense } from "react";

export interface ItemDescendantActionPageProps {
  params: { resumeId: IdSchemaType; action: ResumeActionType };
}

export default async function ItemDescendantActionPage({
  params: { resumeId, action },
}: ItemDescendantActionPageProps) {
  const itemModel = "resume";
  const id = resumeId;

  return (
    <Suspense fallback={<ItemDescendantActionSkeleton />}>
      <ItemDescendantServerComponent itemModel={itemModel} itemId={id} resumeAction={action} />
    </Suspense>
  );
}

function ItemDescendantActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
