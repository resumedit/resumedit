// @/components/layout/MarketingContentLayout.tsx

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ReactNode } from "react";

export default async function MarketingContentLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = null;
  return (
    <>
      <SiteHeader user={user} />
      <main className="container my-auto min-h-screen">{children}</main>
      <SiteFooter />
    </>
  );
}
