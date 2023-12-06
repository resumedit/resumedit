// @/app/(authenticated)/item/[root]/[id]/[action]/page.tsx

"use server";

import { getCurrentUserIdOrNull } from "@/actions/user";
import ItemDescendantServerComponent from "@/components/itemDescendant/ItemDescendant.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType, isValidItemId } from "@/schemas/id";
import { ItemDescendantModelNameType } from "@/types/itemDescendant";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export interface ItemDescendantActionPageProps {
  params: { root: ItemDescendantModelNameType; id: IdSchemaType };
}

export default async function ItemDescendantActionPage({ params: { root, id } }: ItemDescendantActionPageProps) {
  const itemModel = root;
  const resumeAction = "view";

  const userId = await getCurrentUserIdOrNull();
  const validId = isValidItemId(id);
  return !userId || !id || !validId ? (
    notFound()
  ) : (
    <Suspense fallback={<ItemDescendantActionSkeleton />}>
      <ItemDescendantServerComponent itemModel={itemModel} itemId={id} resumeAction={resumeAction} />
    </Suspense>
  );
}

function ItemDescendantActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
