import { ReactNode } from "react";

function SessionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-[50vh] flex flex-col justify-center items-center">{children}</div>
  );
}

export default SessionLayout;
