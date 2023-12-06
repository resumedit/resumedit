import Navbar from "@/app/(layout)/(navigation)/Navbar";
import { ReactNode } from "react";

const AuthenticatedRootLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>{children}</main>
    </>
  );
};

export default AuthenticatedRootLayout;
