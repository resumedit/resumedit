// @/app/(authenticated)/itemDescendant/[root]/[action]/page.tsx

"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import ItemDescendantServerComponent from "@/components/itemDescendant/ItemDescendant.server";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeActionType } from "@/types/resume";
import { Suspense } from "react";

export interface ItemDescendantActionPageProps {
  params: { action: ResumeActionType };
}

export default async function ItemDescendantActionPage({ params: { action } }: ItemDescendantActionPageProps) {
  const root = "resume";

  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<ItemDescendantActionSkeleton />}>
      <ItemDescendantServerComponent rootItemModel={root} parentId={userId} resumeAction={action} />
    </Suspense>
  );
}

function ItemDescendantActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
