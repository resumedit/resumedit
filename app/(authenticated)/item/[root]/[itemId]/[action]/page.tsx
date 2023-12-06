// @/app/(authenticated)/item/[root]/[id]/[action]/page.tsx

"use server";

import ItemDescendantList from "@/components/itemDescendant/ItemDescendantList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType, isValidItemId } from "@/schemas/id";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { ResumeActionType } from "@/types/resume";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export interface ItemDescendantActionPageProps {
  params: { root: ItemDescendantModelNameType; itemId: IdSchemaType; action: ResumeActionType };
}

export default async function ItemDescendantActionPage({
  params: { root, itemId, action },
}: ItemDescendantActionPageProps) {
  const itemModel = root;
  const resumeAction = action;

  const validId = isValidItemId(itemId);
  return !itemId || !validId ? (
    notFound()
  ) : (
    <Suspense fallback={<ItemDescendantActionSkeleton />}>
      <ItemDescendantList itemModel={itemModel} itemId={itemId} resumeAction={resumeAction} />
    </Suspense>
  );
}

function ItemDescendantActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
