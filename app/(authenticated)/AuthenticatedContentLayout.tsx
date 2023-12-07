// @/components/layout/AuthenticatedContentLayout.tsx

import { getCurrentUserOrNull } from "@/actions/user";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { User as PrismaUser } from "@prisma/client";
import { ReactNode } from "react";
import Breadcrumbs from "../../components/layout/navigation/Breadcrumbs";
import Navbar from "../../components/layout/navigation/Navbar";

export interface AuthenticatedContentLayoutChildrenProps {
  user: PrismaUser | null;
}

export default async function AuthenticatedContentLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUserOrNull();
  return (
    <>
      <header className="container">
        <Navbar user={user} />
        <Breadcrumbs />
      </header>
      <main className="container my-auto min-h-screen">{children}</main>
      <SiteFooter />
    </>
  );
}
