import { MainNavItem } from "@/types";
import { siteConfig } from "./site";

export type AppNavigation = {
  home: MainNavItem;
  about: MainNavItem;
  termsOfUse: MainNavItem;
};

export const siteNavigation: AppNavigation = {
  home: {
    title: `${siteConfig.name}`,
    href: "/",
  },
  about: {
    title: `About ${siteConfig.name}`,
    href: "/about",
  },
  termsOfUse: {
    title: `Terms of use for ${siteConfig.name}`,
    href: "/legal",
  },
};
