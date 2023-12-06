// @/app/(authenticated)/item/[action]/page.tsx

"use server";

import ItemDescendantList from "@/components/itemDescendant/ItemDescendantList.server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default async function ItemDescendantActionPage() {
  const itemModel = "user";
  const resumeAction = "edit";

  return (
    <Suspense fallback={<ItemDescendantActionSkeleton />}>
      <ItemDescendantList itemModel={itemModel} resumeAction={resumeAction} />
    </Suspense>
  );
}

function ItemDescendantActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
