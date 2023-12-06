// @/app/(authenticated)/resume/[resumeId]/[action]/page.tsx

"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import ItemDescendantServerComponent from "@/components/itemDescendant/ItemDescendant.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType, isValidItemId } from "@/schemas/id";
import { ResumeActionType } from "@/types/resume";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export interface ItemDescendantActionPageProps {
  params: { resumeId: IdSchemaType; action: ResumeActionType };
}

export default async function ItemDescendantActionPage({
  params: { resumeId, action },
}: ItemDescendantActionPageProps) {
  const itemModel = "resume";
  const id = resumeId;

  const userId = await getCurrentUserIdOrNull();
  const validId = isValidItemId(id);
  return !userId || !id || !validId ? (
    notFound()
  ) : (
    <Suspense fallback={<ItemDescendantActionSkeleton />}>
      <ItemDescendantServerComponent itemModel={itemModel} itemId={id} resumeAction={action} />
    </Suspense>
  );
}

function ItemDescendantActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
