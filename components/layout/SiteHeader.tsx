import * as React from "react";
import Navbar from "./navigation/Navbar";
import Breadcrumbs from "./navigation/Breadcrumbs";
import { AuthenticatedContentLayoutChildrenProps } from "@/app/(authenticated)/AuthenticatedContentLayout";

export interface SiteHeaderProps extends AuthenticatedContentLayoutChildrenProps {}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="container">
      <Navbar user={user} />
      <Breadcrumbs />
    </header>
  );
}
