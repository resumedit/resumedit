import { MainNavItem } from "@/types";
import { siteConfig } from "./site";

export type AppNavigation = {
  tryApp: MainNavItem;
  enterApp: MainNavItem;
  signUp: MainNavItem;
  afterSignUp: MainNavItem;
  signIn: MainNavItem;
  afterSignIn: MainNavItem;
  signOut: MainNavItem;
  afterSignOut: MainNavItem;
  userProfile: MainNavItem;
};

export const appNavigation: AppNavigation = {
  tryApp: {
    title: `Try ${siteConfig.name}`,
    href: "/try",
  },
  enterApp: {
    title: `Enter ${siteConfig.name}`,
    href: "/resume",
  },
  signUp: {
    title: `Sign up`,
    href: "/sign-up",
  },
  afterSignUp: {
    title: `You have signed up for ${siteConfig.name}`,
    href: "/sign-up",
  },
  signIn: {
    title: `Sign in`,
    href: "/sign-in",
  },
  afterSignIn: {
    title: `You have signed in to ${siteConfig.name}`,
    href: "/sign-in",
  },
  signOut: {
    title: `Sign out`,
    href: "/sign-out",
  },
  afterSignOut: {
    title: `You have signed out of${siteConfig.name}`,
    href: "/sign-out",
  },
  userProfile: {
    title: `Settings and profile`,
    href: "/user-profile",
  },
};
