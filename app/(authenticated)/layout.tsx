// @/app/(authenticated)/layout.tsx

import AuthenticatedContentLayout from "@/app/(authenticated)/AuthenticatedContentLayout";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

export default async function AuthenticatedRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthenticatedContentLayout>{children}</AuthenticatedContentLayout>
      <Toaster />
    </ClerkProvider>
  );
}
