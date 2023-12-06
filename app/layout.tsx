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

const font = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResumEdit",
  description: "Your resume meets AI",
};

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body className={font.className}>{children}</body>
//     </html>
//   );
// }

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
            <div className="absolute z-5 top-0 left-0 w-full h-screen bg-gradient-to-br rounded-md filter blur-3xl opacity-50 from-green-100 to-indigo-200 dark:from-green-950 dark:to-indigo-950"></div>
            <div className="relative z-10 flex flex-col min-h-screen min-w-full max-h-screen justify-between">
              <ClerkAuthProvider>
                <div className="container mb-auto">{children}</div>
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
