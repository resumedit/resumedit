// @/app/(authenticated)/itemDescendant/[root]/page.tsx

"use server";

import ItemDescendantServerComponent from "@/components/itemDescendant/ItemDescendant.server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default async function ItemDescendantPage() {
  const itemModel = "user";
  const resumeAction = "edit";
  return (
    <Suspense fallback={<ItemDescendantSkeleton />}>
      <ItemDescendantServerComponent itemModel={itemModel} resumeAction={resumeAction} />
    </Suspense>
  );
}

function ItemDescendantSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
