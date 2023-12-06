"use server";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import EnterActionButton from "../(marketing)/(home)/EnterActionButton";

const RootNotFoundPage = ({ children }: { children?: ReactNode | ReactNode[] }) => {
  notFound();
  return (
    <>
      {children ? (
        children
      ) : (
        <div className="flex flex-col min-h-[50vh] justify-center items-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold md:px-20 pb-10 text-gradient bg-gradient-to-r from-green-800 dark:from-blue-500 to-indigo-900 dark:to-slate-400 bg-clip-text text-transparent">
            This page could not be found
          </h1>
          <div className="py-8">
            <Link href="javascript:histor(-1)" title="Back to previous page">
              <EnterActionButton>Back to previous page</EnterActionButton>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default RootNotFoundPage;
