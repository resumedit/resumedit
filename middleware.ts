import { authMiddleware } from "@clerk/nextjs";
// https://clerk.com/docs/references/nextjs/auth-middleware#making-pages-public-using-public-routes
export default authMiddleware({
  // "/", "/about" and "/legal" will be accessible to visitors without an account
  publicRoutes: ["/", "/(about|legal)(/.*)?"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
