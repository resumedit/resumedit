/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getItemModelFromId, getPrefixFromId } from "@/schemas/id";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";

/**
 * Takes an URL String and removes query params and hash params
 *
 * @param url - The URL string
 * @returns The transformed URL string
 *
 */
const getPathFromUrl = (url: string): string => {
  return url.split(/[?#]/)[0];
};

/**
 * Takes a breadcrumb title (from url path) and replaces
 * special chars to more readable chars
 *
 * @param title - The breadcrumb title
 * @returns The transformed title or the result of the custom transformLabel function
 *
 */
const convertBreadcrumb = (
  title: string,
  toUpperCase: boolean | undefined,
  replaceCharacterList: Array<CharacterMap> | undefined,
  transformLabel?: ((title: string) => React.ReactNode) | undefined,
): React.ReactNode => {
  let transformedTitle = getPathFromUrl(title);

  if (transformLabel) {
    return transformLabel(transformedTitle);
  }

  if (replaceCharacterList) {
    for (let i = 0; i < replaceCharacterList.length; i++) {
      transformedTitle = transformedTitle.replaceAll(replaceCharacterList[i].from, replaceCharacterList[i].to);
    }
  }

  // decode for utf-8 characters and return ascii.
  return toUpperCase ? decodeURI(transformedTitle).toUpperCase() : decodeURI(transformedTitle);
};

export interface Breadcrumb {
  /** Breadcrumb title. Example: 'blog-entries' */
  breadcrumb: string;

  /** The URL which the breadcrumb points to. Example: 'blog/blog-entries' */
  href: string;
}

export interface CharacterMap {
  /** The source character or character pattern that should be replaced (e.g. 'ae') */
  from: string;

  /** The replacement into which the character should be replaced. */
  to: string;
}

export interface SeparatorProps {
  home?: ReactNode;
  beforeInactive?: ReactNode;
  beforeActive?: ReactNode;
  afterActive?: ReactNode;
}

export interface BreadcrumbsProps {
  /** If true, the default styles are used.
   * Make sure to import the CSS in _app.js
   * Example: true Default: false */
  useDefaultStyle?: boolean;

  /** The title for the very first breadcrumb pointing to the root directory. Example: '/' Default: 'HOME' */
  rootLabel?: string | null;

  /** Boolean indicator whether the root label should be omitted. Example: true Default: false */
  omitRootLabel?: boolean;

  /** Boolean indicator if the labels should be displayed as uppercase. Example: true Default: false */
  labelsToUppercase?: boolean | undefined;

  /** Array containing a list of specific characters that should be replaced in the label. This can be useful to convert special characters such as vowels. Example: [{ from: 'ae', to: 'ä' }, { from: '-', to: ' '}] Default: [{ from: '-', to: ' ' }] */
  replaceCharacterList?: Array<CharacterMap> | undefined;

  /** A transformation function that allows to customize the label strings. Receives the label string and has to return a string or React Component */
  transformLabel?: ((title: string) => React.ReactNode) | undefined;

  /** Array containing all the indexes of the path that should be omitted and not be rendered as labels. If we have a path like '/home/category/1' then you might want to pass '[2]' here, which omits the breadcrumb label '1'. Indexes start with 0. Example: [2] Default: undefined */
  omitIndexList?: Array<number> | undefined;

  /** An inline style object for the outer container */
  containerStyle?: any | null;

  /** Classes to be used for the outer container. Won't be used if useDefaultStyle is true */
  containerClassName?: string;

  /** An inline style object for the breadcrumb list */
  listStyle?: any | null;

  /** Classes to be used for the breadcrumb list */
  listClassName?: string;

  /** An inline style object for the inactive breadcrumb list item */
  inactiveItemStyle?: any | null;

  /** Classes to be used for the inactive breadcrumb list item */
  inactiveItemClassName?: string;

  /** An inline style object for the active breadcrumb list item */
  activeItemStyle?: any | null;

  /** Classes to be used for the active breadcrumb list item */
  activeItemClassName?: string;

  /** An inline style object for the active breadcrumb list item */
  activeItemLinkStyle?: any | null;

  /** Classes to be used for the active breadcrumb list item */
  activeItemLinkClassName?: string;

  /** An inline style object for the active breadcrumb list item */
  inactiveItemLinkStyle?: any | null;

  /** Classes to be used for the active breadcrumb list item */
  inactiveItemLinkClassName?: string;

  /** Classes to be used for the active breadcrumb list item */
  separator?: SeparatorProps;
}

/**
 * A functional React component for Next.js that renders a dynamic Breadcrumb navigation
 * based on the current path within the Next.js router navigation.
 *
 * Only works in conjunction with Next.js, since it leverages the Next.js router.
 *
 * By setting useDefaultStyle to true, the default CSS will be used.
 * The component is highly customizable by either custom classes or
 * inline styles, which can be passed as props.
 *
 * @param props - object of type BreadcrumbsProps
 * @returns The breadcrumb React component.
 */
// https://github.com/marketsystems/nextjs13-appdir-breadcrumbs/blob/main/src/index.tsx
function RenderBreadcrumbs({
  useDefaultStyle = false,
  rootLabel = "Home",
  omitRootLabel = false,
  labelsToUppercase = false,
  replaceCharacterList = [
    { from: "-", to: " " },
    { from: "_", to: " " },
  ],
  transformLabel = undefined,
  omitIndexList = undefined,
  containerStyle = null,
  containerClassName = "",
  listStyle = null,
  listClassName = "",
  inactiveItemStyle = null,
  inactiveItemClassName = "",
  activeItemStyle = null,
  activeItemClassName = "",
  activeItemLinkStyle = null,
  activeItemLinkClassName = "",
  inactiveItemLinkStyle = null,
  inactiveItemLinkClassName = "",
  separator = undefined,
}: BreadcrumbsProps) {
  const router = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<Array<Breadcrumb> | null>(null);

  useEffect(() => {
    if (router) {
      const linkPath = router.split("/");
      linkPath.shift();

      const pathArray = linkPath.map((path, i) => {
        return {
          breadcrumb: path,
          href: "/" + linkPath.slice(0, i + 1).join("/"),
        };
      });

      setBreadcrumbs(pathArray);
    }
  }, [router]);

  if (!breadcrumbs) {
    return null;
  }

  return breadcrumbs.length === 0 || breadcrumbs[0].href === "/" ? null : (
    <nav style={containerStyle} className={containerClassName} aria-label="breadcrumbs">
      <ol style={listStyle} className={useDefaultStyle ? "_2jvtI" : listClassName}>
        {!omitRootLabel && (
          <li style={inactiveItemStyle} className={inactiveItemClassName}>
            <Link href="/" className={inactiveItemLinkClassName} style={inactiveItemLinkStyle}>
              {!separator?.home ? null : separator.home}
              {convertBreadcrumb(rootLabel || "Home", labelsToUppercase, replaceCharacterList, transformLabel)}
            </Link>
          </li>
        )}
        {breadcrumbs.length >= 1 &&
          breadcrumbs.map((breadcrumb, i) => {
            if (
              !breadcrumb ||
              breadcrumb.breadcrumb.length === 0 ||
              (omitIndexList && omitIndexList.find((value) => value === i))
            ) {
              return;
            }
            return (
              <li
                key={breadcrumb.href}
                className={i === breadcrumbs.length - 1 ? activeItemClassName : inactiveItemClassName}
                style={i === breadcrumbs.length - 1 ? activeItemStyle : inactiveItemStyle}
              >
                <Link
                  href={breadcrumb.href}
                  className={i === breadcrumbs.length - 1 ? activeItemLinkClassName : inactiveItemLinkClassName}
                  style={i === breadcrumbs.length - 1 ? activeItemLinkStyle : inactiveItemLinkStyle}
                >
                  {!separator?.beforeInactive ? null : separator.beforeInactive}
                  {convertBreadcrumb(breadcrumb.breadcrumb, labelsToUppercase, replaceCharacterList, transformLabel)}
                </Link>
              </li>
            );
          })}
      </ol>
    </nav>
  );
}

export default function Breadcrumbs() {
  const transformLabel = (title: string) => {
    let prettyTitle = title;
    const itemModel = getItemModelFromId(title);
    if (itemModel) {
      prettyTitle = itemModel + " " + getPrefixFromId(title);
    }
    return prettyTitle.charAt(0).toUpperCase() + prettyTitle.slice(1);
  };

  const breadcrumbsProps: BreadcrumbsProps = {
    transformLabel: transformLabel,
    containerClassName: "flex px-4 py-1 mt-2 mb-8 text-muted-foreground bg-muted-foreground/5 rounded-md",
    listClassName: "inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse",
    inactiveItemClassName: "inline-flex items-center",
    activeItemClassName: "inline-flex items-center",
    inactiveItemLinkClassName: "inline-flex items-center",
    activeItemLinkClassName: "inline-flex items-center",
    separator: {
      home: (
        <svg
          className="w-4 h-4 me-2 flex-shrink-0"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
        </svg>
      ),
      beforeInactive: (
        <svg
          className="rtl:rotate-180 block w-3 h-3 mr-2 text-gray-400 "
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 6 10"
        >
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
        </svg>
      ),
    },
  };

  return <RenderBreadcrumbs {...breadcrumbsProps} />;

  /*
    <nav
      className="flex px-5 py-3 text-gray-700 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
          >
            <svg
              className="w-3 h-3 me-2.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
            </svg>
            Home
          </Link>
        </li>
        <li>
          <div className="flex items-center">
            <svg
              className="rtl:rotate-180 block w-3 h-3 mx-1 text-gray-400 "
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m1 9 4-4-4-4"
              />
            </svg>
            <Link
              href="#"
              className="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
            >
              Templates
            </Link>
          </div>
        </li>
        <li aria-current="page">
          <div className="flex items-center">
            <svg
              className="rtl:rotate-180  w-3 h-3 mx-1 text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 6 10"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m1 9 4-4-4-4"
              />
            </svg>
            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">...</span>
          </div>
        </li>
      </ol>
    </nav>
  */
}
