import * as React from "react";

import { Icons } from "@/components/custom/Icons";
import { DarkModeMenu } from "@/components/custom/DarkModeMenu";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("dark mt-8 flex flex-col gap-y-4 bg-background py-8 text-foreground", className)}>
      <div className="container flex flex-col items-center justify-center gap-4 align-baseline sm:flex-row sm:justify-between">
        {siteConfig.platforms && (
          <div
            className="text-center text-sm md:text-left"
            dangerouslySetInnerHTML={{ __html: siteConfig.platforms }}
          />
        )}
        <div className="flex items-center space-x-2 text-center text-sm">
          <span className="uppercase text-muted-foreground">Dark mode</span>
          <DarkModeMenu />
        </div>
      </div>
      <div className="md:min-h-8 container flex w-full items-center justify-center gap-4 sm:justify-between md:flex-row">
        <div className="flex items-center gap-4 p-0">
          <Icons.logo />
          <p className="text-center text-sm leading-loose md:text-left">
            Built by{" "}
            <a
              href={siteConfig.author.links.professionalWebsite}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              {siteConfig.author.name}
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
