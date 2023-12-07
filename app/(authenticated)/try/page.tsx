// @/app/(authenticated)/try/page.tsx

"use server";

import { getCurrentUserOrNull } from "@/actions/user";
import TryAppSection from "./TryAppMessage";

export default async function TryAppPage() {
  return <TryAppSection user={await getCurrentUserOrNull()} />;
}
