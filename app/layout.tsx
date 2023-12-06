import { SiteFooter } from "@/app/(layout)/SiteFooter";
import ClerkAuthProvider from "@/auth/clerk/ClerkAuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
// import { Theme } from "@radix-ui/themes";
// import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import Breadcrumbs from "./(layout)/(navigation)/Breadcrumbs";
import Navbar from "./(layout)/(navigation)/Navbar";
import "./globals.css";
// import { Suspense } from "react";
// import { PHProvider, PostHogPageview } from "@/components/providers/PostHog";

const font = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResumEdit",
  description: "Your resume meets AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /// https://ui.shadcn.com/docs/dark-mode/next: need
    // to add suppressHydrationWarning because the next-themes
    // ThemeProvider returns attributes "class" and "style" on the server
    // to avoid the following warning:
    // app-index.js:31 Warning: Extra attributes from the server: class,style
    //     at html
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <NextTopLoader showSpinner={false} />
        {/* <Suspense>
          <PostHogPageview />
        </Suspense>
        <PHProvider> */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* 2023-11-19: importing radix-ui/themes leads to errors regarding `Slot` not being exportet
           <Theme accentColor="indigo" grayColor="slate" panelBackground="solid" scaling="100%" radius="medium"> */}
          <div className="relative bg-background">
            <div className="z-5 fixed left-0 top-0 h-screen w-full rounded-md bg-gradient-to-br from-neutral-300 to-indigo-300 opacity-50 blur-3xl filter dark:from-neutral-600 dark:to-indigo-900"></div>
            <div className="relative z-10 flex min-w-full flex-col justify-between">
              <ClerkAuthProvider>
                <header className="container">
                  <Navbar />
                  <Breadcrumbs />
                </header>
                <main className="container my-auto min-h-screen">{children}</main>
              </ClerkAuthProvider>
              <SiteFooter />
              <Toaster />
            </div>
          </div>
          {/* </Theme> */}
        </ThemeProvider>
        {/* </PHProvider> */}
      </body>
    </html>
  );
}
