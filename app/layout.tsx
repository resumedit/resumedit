import { SiteFooter } from "@/app/(layout)/SiteFooter";
import ClerkAuthProvider from "@/auth/clerk/ClerkAuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
// import { Theme } from "@radix-ui/themes";
// import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import Navbar from "./(layout)/(navigation)/Navbar";

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* 2023-11-19: importing radix-ui/themes leads to errors regarding `Slot` not being exportet
           <Theme accentColor="indigo" grayColor="slate" panelBackground="solid" scaling="100%" radius="medium"> */}
          <div className="relative bg-background">
            <div className="fixed z-5 top-0 left-0 w-full h-screen bg-gradient-to-br rounded-md filter blur-3xl opacity-50 from-neutral-300 to-indigo-300 dark:from-neutral-600 dark:to-indigo-900"></div>
            <div className="relative z-10 flex flex-col min-w-full justify-between">
              <ClerkAuthProvider>
                <header className="container">
                  <Navbar />
                </header>
                <main className="container min-h-screen my-auto">{children}</main>
              </ClerkAuthProvider>
              <SiteFooter />
              <Toaster />
            </div>
          </div>
          {/* </Theme> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
