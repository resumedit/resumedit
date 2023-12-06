// @/app/(authenticated)/item/[action]/page.tsx

"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import ItemDescendantServerComponent from "@/components/itemDescendant/ItemDescendant.server";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemDescendantModelNameType, getParentModel } from "@/types/itemDescendant";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export interface ItemDescendantActionPageProps {
  params: { root: ItemDescendantModelNameType };
}

export default async function ItemDescendantActionPage({ params: { root } }: ItemDescendantActionPageProps) {
  const itemModel = getParentModel(root);
  const resumeAction = "edit";

  const userId = await getCurrentUserIdOrNull();
  return !userId || !itemModel ? (
    notFound()
  ) : (
    <Suspense fallback={<ItemDescendantActionSkeleton />}>
      <ItemDescendantServerComponent itemModel={itemModel} resumeAction={resumeAction} />
    </Suspense>
  );
}

function ItemDescendantActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
