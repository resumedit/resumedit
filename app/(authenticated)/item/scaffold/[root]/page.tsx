"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import ItemDescendantScaffoldServerComponent from "@/components/itemDescendant/ItemDescendantScaffold.server";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { Suspense } from "react";

export interface ItemDescendantPageProps {
  params: { root: ItemDescendantModelNameType };
}

export default async function ItemDescendantScaffoldPage({ params: { root } }: ItemDescendantPageProps) {
  const userId = await getCurrentUserIdOrNull();
  return !userId ? null : (
    <Suspense fallback={<ItemDescendantSkeleton />}>
      <ItemDescendantScaffoldServerComponent rootItemModel={root} parentId={userId} />
    </Suspense>
  );
}

function ItemDescendantSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
