// import ClerkAuthProvider from "@/auth/clerk/ClerkAuthProvider";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import { Suspense } from "react";
// import { PHProvider, PostHogPageview } from "@/components/providers/PostHog";

const font = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function MarketingRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    /// https://ui.shadcn.com/docs/dark-mode/next: need
    // to add suppressHydrationWarning because the next-themes
    // ThemeProvider returns attributes "class" and "style" on the server
    // to avoid the following warning:
    // app-index.js:31 Warning: Extra attributes from the server: class,style
    //     at html
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        {/* <Suspense>
            <PostHogPageview />
          </Suspense>
          <PHProvider> */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative bg-background">
            <div className="z-5 fixed left-0 top-0 h-screen w-full rounded-md bg-gradient-to-br from-neutral-300 to-indigo-300 opacity-50 blur-3xl filter dark:from-neutral-600 dark:to-indigo-900"></div>
            <div className="relative z-10 flex min-w-full flex-col justify-between">{children}</div>
          </div>
        </ThemeProvider>
        {/* </PHProvider> */}
        <Toaster />
      </body>
    </html>
  );
}
