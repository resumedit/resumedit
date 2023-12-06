import { ReactNode } from "react";

function SessionLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[50vh] w-full flex-col items-center justify-center">{children}</div>;
}

export default SessionLayout;
