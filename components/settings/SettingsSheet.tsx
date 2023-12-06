// @/components/settings/SettingsSheet.tsx

"use client";

// FIXME: Somehow TypeScript has trouble importing react-markdown
// import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  // SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { settingsConfig } from "@/config/settings";
import { siteConfig } from "@/config/site";
import { Settings2Icon } from "lucide-react";
import React from "react";
import SettingsForm from "./SettingsForm";

export default function SettingsSheet() {
  return (
    <Sheet>
      <SheetTrigger>{<Settings2Icon />}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configure {siteConfig.name}</SheetTitle>
          <SheetDescription className="py-4">
            <ReactMarkdown
              components={{
                p: React.Fragment as unknown as keyof JSX.IntrinsicElements,
              }}
            >
              {settingsConfig.description}
            </ReactMarkdown>
          </SheetDescription>
        </SheetHeader>
        <SettingsForm />
      </SheetContent>
    </Sheet>
  );
}
