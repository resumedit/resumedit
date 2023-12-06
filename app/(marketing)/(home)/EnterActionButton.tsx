// @/app/(marketing)/(home)/EnterActionButton.tsx

import { ActionButton } from "@/components/custom/ActionButton";
import React, { ReactNode } from "react";

export default function EnterActionButton({ children }: { children: ReactNode | ReactNode[] }) {
  return (
    <ActionButton
      variant="default"
      className="text-background dark:hover:text-foreground
    bg-gradient-to-r
    from-green-800 hover:from-green-600 dark:from-blue-200 hover:dark:from-blue-300
    to-indigo-900 hover:to-indigo-700 dark:to-slate-300 hover:dark:to-slate-400
    p-5 text-lg md:text-3xl md:p-8
    "
    >
      {children}
    </ActionButton>
  );
}
