import * as React from "react";

import { Icons } from "@/components/custom/Icons";
import { ModeToggle } from "@/components/custom/ModeToggle";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("mt-8 flex flex-col py-8 gap-y-4 dark bg-background text-foreground", className)}>
      <div className="container flex flex-col items-center justify-center gap-4 sm:flex-row align-baseline sm:justify-between">
        {siteConfig.platforms && (
          <div
            className="text-center text-sm md:text-left"
            dangerouslySetInnerHTML={{ __html: siteConfig.platforms }}
          />
        )}
        <div className="flex items-center space-x-2 text-center text-sm">
          <span className="text-muted-foreground uppercase">Dark mode</span>
          <ModeToggle />
        </div>
      </div>
      <div className="container w-full flex items-center justify-center sm:justify-between gap-4 md:min-h-8 md:flex-row">
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
