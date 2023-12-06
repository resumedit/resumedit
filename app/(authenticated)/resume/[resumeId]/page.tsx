// @/app/(authenticated)/resume/[resumeId]/page.tsx

"use server";

import ItemDescendantServerComponent from "@/components/itemDescendant/ItemDescendant.server";
import { Skeleton } from "@/components/ui/skeleton";
import { IdSchemaType } from "@/schemas/id";
import { Suspense } from "react";

export interface ItemDescendantActionPageProps {
  params: { resumeId: IdSchemaType };
}

export default async function ItemDescendantActionPage({ params: { resumeId } }: ItemDescendantActionPageProps) {
  const itemModel = "resume";
  const id = resumeId;
  const resumeAction = "view";

  return (
    <Suspense fallback={<ItemDescendantActionSkeleton />}>
      <ItemDescendantServerComponent itemModel={itemModel} itemId={id} resumeAction={resumeAction} />
    </Suspense>
  );
}

function ItemDescendantActionSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-48 w-full shadow-lg" />;
}
