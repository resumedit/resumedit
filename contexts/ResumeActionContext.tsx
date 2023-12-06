// ResumeActionContext.tsx

"use client";

import { ResumeActionType } from "@/types/resume";
import { ReactNode, createContext, useContext } from "react";

interface ResumeActionContextProps {
  children: ReactNode;
  resumeAction: string;
}

const ResumeActionContext = createContext<string | null>(null);

export function ResumeActionProvider({ children, resumeAction }: ResumeActionContextProps) {
  return <ResumeActionContext.Provider value={resumeAction}>{children}</ResumeActionContext.Provider>;
}

export function useResumeAction() {
  const context = useContext(ResumeActionContext);
  if (context === null) {
    throw new Error("useResumeAction must be used within a ResumeActionProvider");
  }
  return context as ResumeActionType;
}
