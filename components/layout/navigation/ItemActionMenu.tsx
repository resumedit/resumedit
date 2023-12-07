/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { sentenceCase } from "@/lib/utils/misc";
import { idRegex } from "@/schemas/id";
import { itemDescendantModelHierarchy } from "@/types/itemDescendant";
import { ResumeActionType, resumeActionTypes } from "@/types/resume";
import Link from "next/link";
import React, { ReactNode } from "react";

// Define a type for the action URL structure
type ActionURL = {
  title: string;
  url: string;
  active: boolean;
};

// Define a type where the keys are ResumeActionType and values are ActionURL objects
type ResumeActionsURLMap = {
  [K in ResumeActionType]: ActionURL;
};

export function getItemActions(
  pathname: string,
  title?: string,
): { menuTitle: string; actions: ResumeActionsURLMap } | undefined {
  // Define the regular expression with named groups
  const itemModelRE = itemDescendantModelHierarchy.join("|");
  const itemIdRE = idRegex.substring(1, idRegex.length - 1);
  const itemActionRE = resumeActionTypes.join("|");

  const extractRegExp = new RegExp(
    `^(.*?)/(?<itemModel>${itemModelRE})/(?<itemId>${itemIdRE})(?:/(?<itemAction>${itemActionRE}))?`,
  );

  // Execute the regular expression
  const match = extractRegExp.exec(pathname);
  if (!match?.groups) {
    return undefined;
  }

  // Extract named groups
  const { itemModel, itemId, itemAction = resumeActionTypes[0] } = match.groups;

  // Check if itemModel and itemId are available
  if (!itemModel || !itemId) {
    return undefined;
  }

  // Construct the URLs
  const actionBaseURL = `${match[1]}/${itemModel}/${itemId}`;
  const viewActionURL = `${actionBaseURL}/view`;
  const editActionURL = `${actionBaseURL}/edit`;

  // Construct the menu title unless it has been passed as an argument
  const menuTitle = title ?? sentenceCase(`${itemModel} actions`);

  // Construct and return the object with URLs
  return {
    menuTitle,
    actions: {
      view: { title: `View ${itemModel}`, url: viewActionURL, active: itemAction === "view" },
      edit: { title: `Edit ${itemModel}`, url: editActionURL, active: itemAction === "edit" },
    },
  };
}

export function ItemActionMenu(pathname: string, title?: string): ReactNode {
  // Render an action menu if and only if we are already on a specific item
  const itemActions = getItemActions(pathname, title);
  if (!itemActions) return null;

  return (
    <NavigationMenu className="z-5">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{itemActions.menuTitle}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="flex w-max flex-col">
              {Object.entries(itemActions.actions).map(([actionKey, action]) => {
                return (
                  <ItemActionMenuListItem
                    key={actionKey}
                    href={action.url}
                    active={action.active}
                    title={sentenceCase(actionKey)}
                  >
                    {action.title}
                  </ItemActionMenuListItem>
                );
              })}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ItemActionMenuListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { active: boolean }
>(({ className, href, title, children, active, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild active={active}>
        <Link
          href={href ?? "#"}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
            {
              "bg-accent bg-opacity-50": active, // Apply additional styles if active
            },
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ItemActionMenuListItem.displayName = "ListItem";
